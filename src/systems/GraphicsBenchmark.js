/** Browser-frame benchmark, runs inside the real game (does NOT simulate FPS).
 * Rendering runs normally; each tier is warmed up, then timed for a few seconds.
 * The app must restore the original GraphicsQuality after completion/cancel.
 */
export const BENCHMARK_TIERS=Object.freeze(['economy','balanced','quality']);
const LABELS={economy:'LEVE',balanced:'EQUILIBRADO',quality:'DETALHADO'};
const valid=(x)=>Number.isFinite(x)&&x>0;
const average=(xs)=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
export function summarizeFrames(tier,frames,draws=[],triangles=[]){
  const sorted=frames.slice().sort((a,b)=>a-b);
  const count=sorted.length;
  if(!count)return {tier,fps:0,low1FPS:0,p95ms:0,stutters:0,drawCalls:0,triangles:0,frames:0};
  const sum=frames.reduce((a,b)=>a+b,0);
  const worst=sorted.slice(-Math.max(1,Math.ceil(count*.01)));
  return {tier,
    fps:count/sum,
    low1FPS:1/average(worst),
    p95ms:sorted[Math.min(count-1,Math.ceil(count*.95)-1)]*1000,
    stutters:frames.filter(s=>s>=.05).length,
    drawCalls:average(draws),triangles:average(triangles),frames:count};
}
export class GraphicsBenchmark {
  constructor({tiers=BENCHMARK_TIERS,warmupSeconds=.8,sampleSeconds=4,maxSamples=1440}={}){
    if(!Array.isArray(tiers)||!tiers.length||tiers.some(t=>!BENCHMARK_TIERS.includes(t)))throw Error('Invalid benchmark tiers');
    this.tiers=tiers.slice();this.warmupSeconds=Math.max(0,warmupSeconds);
    this.sampleSeconds=Math.max(.05,sampleSeconds);this.maxSamples=Math.max(1,Math.floor(maxSamples));
    this.active=false;this.results=[];this.recordedFrames=0;
  }
  get tier(){return this.tiers[this.index];}
  start(){
    this.active=true;this.results=[];this.index=0;this.elapsed=0;this.phase=this.warmupSeconds>0?'warmup':'sample';
    this.frames=[];this.draws=[];this.triangles=[];this.recordedFrames=0;
    return this.tier;
  }
  cancel(){this.active=false;this.phase='stopped';}
  recordFrame(seconds,{calls=0,triangles=0}={}){
    if(!this.active||!valid(seconds))return null;
    if(this.phase==='warmup'){
      this.elapsed+=seconds;
      if(this.elapsed>=this.warmupSeconds){this.phase='sample';this.elapsed=0;}
      return null;
    }
    const duration=Math.min(seconds,3);
    this.elapsed+=duration;
    this.frames.push(duration);
    this.draws.push(Number.isFinite(calls)?calls:0);
    this.triangles.push(Number.isFinite(triangles)?triangles:0);
    this.recordedFrames++;
    if(this.elapsed+1e-9<this.sampleSeconds&&this.recordedFrames<this.maxSamples)return null;
    this.results.push(summarizeFrames(this.tier,this.frames,this.draws,this.triangles));
    this.index++;
    if(this.index>=this.tiers.length){this.active=false;this.phase='complete';return {type:'complete',results:this.results.slice()};}
    this.elapsed=0;this.phase=this.warmupSeconds>0?'warmup':'sample';this.frames=[];this.draws=[];this.triangles=[];this.recordedFrames=0;
    return {type:'next',tier:this.tier};
  }
  progress(){
    if(!this.active)return '';
    const total=this.phase==='warmup'?this.warmupSeconds:this.sampleSeconds;
    const percent=Math.min(100,Math.round(this.elapsed/Math.max(total,.01)*100));
    return `${LABELS[this.tier]} · ${this.phase==='warmup'?'aquecendo':'medindo'} ${percent}%`;
  }
}
const num=n=>Number.isFinite(n)?Math.round(n).toLocaleString('pt-BR'):'—';
export function formatBenchmark(results=[]){
  const rows=results.map(r=>`${LABELS[r.tier]??r.tier}: ${num(r.fps)} FPS | 1% low: ${num(r.low1FPS)} | p95: ${r.p95ms.toFixed(1)} ms | GPU: ${num(r.drawCalls)} draws / ${num(r.triangles)} triângulos | travadas: ${r.stutters}`);
  return ['COMPARAÇÃO DE DESEMPENHO REAL (neste dispositivo)',...rows,'',
    'Mantenha câmera e posição semelhantes; FPS não mede o custo isolado da GPU.',
    'As medições são locais e não mudam missões/salvamentos.'].join('\n');
}
