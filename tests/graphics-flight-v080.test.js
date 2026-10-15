import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {steeringRate,bankTarget,flightPitch,tailYaw} from '../src/entities/flightHandling.js';
import {pixelRatioFor,suggestedTier,nextAdaptiveTier,GraphicsQuality} from '../src/systems/GraphicsQuality.js';

const near=(a,b,epsilon=1e-8)=>assert.ok(Math.abs(a-b)<epsilon,`${a} deveria ser ≈ ${b}`);
const fakeRenderer=()=>({ratio:0,setPixelRatio(v){this.ratio=v;},shadowMap:{enabled:true,needsUpdate:false}});
const fakeStore=(first=null)=>({stored:first, getItem(){return this.stored;},setItem(k,v){this.stored=v;}});

test('voo: a taxa de curva diminui com a velocidade e continua controlável',()=>{
  assert.ok(steeringRate(0,true)>steeringRate(52,true));
  near(steeringRate(4,false),1.7);near(steeringRate(100,true),steeringRate(52,true));
});
test('voo: curva mais rápida não provoca tombamento além do limite',()=>{
  for(const turn of [-100,-1,0,1,100])for(const speed of [0,20,80]){
    const bank=bankTarget(turn,speed,true,100);
    assert.ok(Math.abs(bank)<=.41);
  }
  near(bankTarget(0,20,false),0);
});
test('voo: inclinação acompanha a velocidade de subida/descida',()=>{
  assert.ok(flightPitch(20,true)<0);assert.ok(flightPitch(-20,true)>0);
  near(flightPitch(1000,true),-.2);near(flightPitch(-1000,true),.2);near(flightPitch(50,false),0);
});
test('voo: cauda articula em sentidos opostos ao virar',()=>{
  for(const i of [0,2,5])assert.ok(tailYaw(1,i,1)<tailYaw(-1,i,1));
  assert.ok(Math.abs(tailYaw(1,5,1)-tailYaw(-1,5,1))>Math.abs(tailYaw(1,0,1)-tailYaw(-1,0,1)));
});
test('gráficos: perfis limitam densidade de pixels e nunca a ampliam além do dispositivo',()=>{
  near(pixelRatioFor('economy',4),.82);near(pixelRatioFor('balanced',4),1.2);
  near(pixelRatioFor('quality',4),1.65);near(pixelRatioFor('quality',1),1);
  near(pixelRatioFor('economy',NaN),.82);
});
test('gráficos: aparelho touch/baixa memória começa equilibrado',()=>{
  assert.equal(suggestedTier({coarse:true}),'balanced');
  assert.equal(suggestedTier({deviceMemory:2}),'balanced');
  assert.equal(suggestedTier({coarse:false,deviceMemory:16}),'quality');
});
test('gráficos: histerese exige 3 segundos ruins antes de cair de nível',()=>{
  assert.equal(nextAdaptiveTier('quality',20,2,0),'quality');
  assert.equal(nextAdaptiveTier('quality',20,3,0),'balanced');
  assert.equal(nextAdaptiveTier('economy',20,5,0),'economy');
});
test('gráficos: recuperação requer 10 segundos bons',()=>{
  assert.equal(nextAdaptiveTier('economy',61,0,9),'economy');
  assert.equal(nextAdaptiveTier('economy',61,0,10),'balanced');
  assert.equal(nextAdaptiveTier('quality',61,0,20),'quality');
});
test('gráficos: modo automático baixa resolução e desabilita sombras quando necessário',()=>{
  const renderer=fakeRenderer(),quality=new GraphicsQuality(renderer,2,false,12,fakeStore());
  assert.equal(quality.tier,'quality');
  assert.equal(quality.sample(20),false);assert.equal(quality.sample(20),false);
  assert.equal(quality.sample(20),true);assert.equal(quality.tier,'balanced');
  for(let i=0;i<12;i++)assert.equal(quality.sample(20),false);
  for(let i=0;i<3;i++)quality.sample(20);
  assert.equal(quality.tier,'economy');assert.equal(renderer.shadowMap.enabled,false);near(renderer.ratio,.82);
});
test('gráficos: preferência manual fica estável independentemente dos frames',()=>{
  const renderer=fakeRenderer(),quality=new GraphicsQuality(renderer,2,false,8,fakeStore('economy'));
  for(let i=0;i<50;i++)assert.equal(quality.sample(5),false);
  assert.equal(quality.tier,'economy');assert.equal(quality.mode,'economy');
});
test('gráficos: tecla G percorre quatro modos sem alterar a partida',()=>{
  const store=fakeStore('auto'),quality=new GraphicsQuality(fakeRenderer(),2,false,8,store);
  assert.equal(quality.cycle(),'LEVE');assert.equal(store.stored,'economy');
  assert.equal(quality.cycle(),'EQUILIBRADO');assert.equal(quality.cycle(),'DETALHADO');
  assert.ok(quality.cycle().startsWith('AUTO'));
});
test('gráficos: redimensionar aplica densidade nova do dispositivo',()=>{
  const renderer=fakeRenderer(),quality=new GraphicsQuality(renderer,3,false,8,fakeStore('balanced'));
  near(renderer.ratio,1.2);quality.onResize(.9);near(renderer.ratio,.9);
});
test('integração: floresta usa instanciamento, preservando colisores antigos',()=>{
  const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const world=readFileSync(resolve(base,'src/world/World.js'),'utf8');
  assert.ok(world.includes('this.flushFoliage();'));
  assert.ok(world.includes('new THREE.InstancedMesh'));
  assert.ok(world.includes("this.addObstacle(x,y,z,.82*size,5.2*size,'tree')"));
  assert.ok(world.includes("this.addObstacle(x,y,z,1.18*size,1.2*size,'rock')"));
  const html=readFileSync(resolve(base,'index.html'),'utf8');
  assert.ok(html.includes('id="quality-toggle"'));
  const game=readFileSync(resolve(base,'src/game/Game.js'),'utf8');
  assert.ok(game.includes('this.graphics.sample(fps)'));
  assert.ok(game.includes("this.input.consume('g')"));
});
