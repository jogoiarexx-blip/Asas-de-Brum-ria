import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GraphicsBenchmark,formatBenchmark} from '../src/systems/GraphicsBenchmark.js';

function runTier(b,frame=.02,calls=123,triangles=4567){
  let event;
  for(let i=0;i<1000;i++){
    event=b.recordFrame(frame,{calls,triangles});
    if(event?.type==='next'||event?.type==='complete')return event;
  }
  throw new Error('Benchmark did not progress');
}

test('medição percorre leve, equilibrado e detalhado e restaura ao terminar',()=>{
  const b=new GraphicsBenchmark({warmupSeconds:.06,sampleSeconds:.2});
  assert.equal(b.start(),'economy');
  assert.equal(b.active,true);
  assert.deepEqual(runTier(b),{type:'next',tier:'balanced'});
  assert.deepEqual(runTier(b),{type:'next',tier:'quality'});
  const result=runTier(b);
  assert.equal(result.type,'complete');
  assert.equal(b.active,false);
  assert.deepEqual(b.results.map(v=>v.tier),['economy','balanced','quality']);
  for(const v of b.results){
    assert.ok(v.fps>=48&&v.fps<=51);
    assert.equal(v.drawCalls,123);
    assert.equal(v.triangles,4567);
    assert.ok(v.p95ms>=19.9);
  }
});

test('aquecimento é excluído da média e das travadas',()=>{
 const b=new GraphicsBenchmark({tiers:['economy'],warmupSeconds:.05,sampleSeconds:.20});
 b.start();b.recordFrame(.05,{calls:999,triangles:999});
 for(let i=0;i<10;i++)b.recordFrame(.02,{calls:10,triangles:100});
 assert.ok(b.results.length===1);
 assert.ok(Math.abs(b.results[0].fps-50)<.01);
 assert.equal(b.results[0].drawCalls,10);
 assert.equal(b.results[0].stutters,0);
});

test('métrica de FPS mínimo 1% e p95 revela frames lentos',()=>{
 const b=new GraphicsBenchmark({tiers:['economy'],warmupSeconds:0,sampleSeconds:1.01});b.start();
 b.recordFrame(.01);
 for(let i=0;i<80;i++)b.recordFrame(.01,{calls:35,triangles:200});
 b.recordFrame(.2,{calls:80,triangles:500});
 assert.equal(b.active,false);
 assert.ok(b.results[0].low1FPS < b.results[0].fps);
 assert.ok(b.results[0].p95ms>0);
 assert.equal(b.results[0].stutters,1);
});

test('cancelamento mantém resultados encerrados e não inicia outra medição',()=>{
 const b=new GraphicsBenchmark({warmupSeconds:.1,sampleSeconds:.2});
 b.start(); b.recordFrame(.08);b.cancel();
 assert.equal(b.active,false);assert.equal(b.recordFrame(.01),null);
 assert.equal(b.results.length,0);assert.equal(b.start(),'economy');
});

test('não registra tempo inválido nem excede o limite de amostras',()=>{
 const b=new GraphicsBenchmark({tiers:['economy'],warmupSeconds:0,sampleSeconds:999,maxSamples:7});b.start();
 b.recordFrame(NaN);b.recordFrame(-1);b.recordFrame(0);
 assert.equal(b.recordedFrames,0);
 for(let i=0;i<50;i++)b.recordFrame(.016);
 assert.ok(b.recordedFrames<=7);
 b.cancel();
});

test('formatação avisa que FPS é medido na máquina, não em simulação',()=>{
 const b=new GraphicsBenchmark({warmupSeconds:.05,sampleSeconds:.2});b.start();
 while(b.active)b.recordFrame(.025,{calls:100,triangles:2000});
 const text=formatBenchmark(b.results);
 for(const label of ['LEVE','EQUILIBRADO','DETALHADO','FPS','1%','GPU'])assert.ok(text.includes(label),label);
});

test('integração aciona B, mostra resultado e suspende auto qualidade durante teste',()=>{
 const input=readFileSync(new URL('../src/game/Input.js',import.meta.url),'utf8');
 const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(input,/'b'/);
 assert.match(game,/this\.benchmark\.recordFrame\(/);
 assert.match(game,/this\.input\.consume\('b'\)/);
 assert.match(game,/!benchmarking && this\.graphics\.sample/);
 assert.match(page,/id="benchmark-toggle"/);
});

test('o quadro medido não avança missões, movimento nem IA (comparação estática)',()=>{
 const source=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 const position=source.indexOf('if(this.benchmark.active){\n          this.renderer.render(this.scene,this.camera);');
 const gameplay=source.indexOf('    this.world.update(dt,this.elapsed);');
 assert.ok(position>0 && position<gameplay, 'benchmark deve renderizar antes de avançar simulação');
 assert.match(source.slice(position,gameplay),/this\.updateBenchmark\(realDt\);\s*return;/);
});

test('controle gráfico e perda de foco restauram perfil sem alterar save ou preferência',()=>{
 const source=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 assert.match(source,/this\.cancelBenchmark\('Teste interrompido: modo gráfico alterado\.'\)/);
 assert.match(source,/if\(document\.hidden\)\{this\.cancelBenchmark/);
 assert.match(source,/this\.graphics\.tier=this\.benchmarkPrevious\.tier|this\.setBenchmarkTier\(this\.benchmarkPrevious\.tier\)/);
});

test('relatório não divide por zero quando não existem frames ou estatísticas',()=>{
 const b=new GraphicsBenchmark({tiers:['economy'],warmupSeconds:0,sampleSeconds:1,maxSamples:1});
 b.start();const event=b.recordFrame(.02,{calls:NaN,triangles:Infinity});
 assert.equal(event.type,'complete');
 assert.equal(b.results[0].drawCalls,0);
 assert.equal(b.results[0].triangles,0);
 assert.ok(Number.isFinite(b.results[0].fps));
});
