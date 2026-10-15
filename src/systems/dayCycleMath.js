/** Relógio e iluminação do arquipélago: 1 volta do céu = 12 min de jogo. */
export const DAY_SECONDS = 720;
export const DEFAULT_PHASE = 0.43; // manhã avançada ao iniciar nova partida
export function normalizeDayCycle(data){
  const phase=typeof data?.phase==='number'&&Number.isFinite(data.phase)?data.phase:DEFAULT_PHASE;
  return {phase:Math.min(1-Number.EPSILON,Math.max(0,phase))};
}
export function advanceDayCycle(data,seconds){
  const phase=normalizeDayCycle(data).phase;
  const dt=Number.isFinite(seconds)?Math.max(0,seconds):0;
  return {phase:(phase+(dt%DAY_SECONDS)/DAY_SECONDS)%1};
}
export const clamp01=n=>Math.max(0,Math.min(1,n));
export function daylight(phase){
  const p=normalizeDayCycle({phase}).phase;
  const altitude=-Math.cos(2*Math.PI*p); // 0=meia-noite, .25=amanhecer, .5=meio-dia
  const sun=clamp01((altitude+.14)/.39);
  const dawn=clamp01(1-Math.abs(altitude)/.4)*clamp01((altitude+.25)/.35);
  return {altitude,sun,dawn,stars:clamp01((.11-altitude)/.41)};
}
export function clockLabel(phase){
  const minutes=Math.floor(normalizeDayCycle({phase}).phase*1440+1e-8)%1440;
  return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
}
export function mixHex(a,b,weight){
  const t=clamp01(weight);
  const a0=(a>>>16)&255,a1=(a>>>8)&255,a2=a&255;
  const b0=(b>>>16)&255,b1=(b>>>8)&255,b2=b&255;
  const c0=Math.round(a0+(b0-a0)*t),c1=Math.round(a1+(b1-a1)*t),c2=Math.round(a2+(b2-a2)*t);
  return (c0<<16)|(c1<<8)|c2;
}
export function skyLighting(phase,weather){
  const {sun,dawn}=daylight(phase);
  // Tempestade ainda domina a paleta durante o dia. Ao anoitecer preserva-se
  // a matiz de cada clima, mas nunca são usados valores de luz negativos.
  const nightSky=0x081a34,nightFog=0x16354b,twilightSky=0xd58a6a;
  const sky=mixHex(mixHex(nightSky,weather.sky,sun),twilightSky,dawn*(1-sun)*.58);
  const fog=mixHex(mixHex(nightFog,weather.fog,sun),twilightSky,dawn*(1-sun)*.26);
  return {sky,fog,sun:weather.sun*(.045+.955*sun),hemisphere:weather.hemisphere*(.19+.81*sun),sunColor:mixHex(0x8fa5cf,0xffeccb,sun),sunlight:sun};
}
/** Vento tem intensidade limitada para não impedir o controle do dragão. */
export function windDisplacement(strength,time,dt,altitude){
  if(!(strength>0)||!(dt>0)||altitude<4)return {x:0,z:0};
  const gust=.72+.28*Math.sin(time*.37+1)**2;
  const drift=Math.min(3.8,3.8*strength*gust)*Math.min(dt,.05);
  return {x:Math.cos(time*.053+.65)*drift,z:Math.sin(time*.053+.65)*drift};
}
