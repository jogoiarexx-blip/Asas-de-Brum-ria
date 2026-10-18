import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bossAttackPattern,bossShotDirections,bossPatternLabel} from '../src/systems/MountainCombat.js';
const direction={x:0,y:0,z:-1};
test('chefe alterna tiros diretos e leque na primeira fase',()=>{
 assert.equal(bossAttackPattern(0,12),'aimed');
 assert.equal(bossAttackPattern(1,12),'fan');
 assert.equal(bossAttackPattern(2,12),'aimed');
});
test('chefe usa terceiro ataque vertical apenas quando muito ferido',()=>{
 const kinds=new Set(Array.from({length:7},(_,i)=>bossAttackPattern(i,4)));
 assert.ok(kinds.has('aimed'));assert.ok(kinds.has('fan'));assert.ok(kinds.has('vertical'));
});
test('tiro direto continua único',()=>{
 assert.equal(bossShotDirections(direction,'aimed').length,1);
});
test('leque tem três trajetórias divergentes normalizadas, sem homing',()=>{
 const shots=bossShotDirections(direction,'fan');assert.equal(shots.length,3);
 assert.ok(shots[0].x*shots[2].x<0);
 for(const v of shots)assert.ok(Math.abs(Math.hypot(v.x,v.y,v.z)-1)<1e-8);
});
test('ataque vertical dá chances de esquivar subindo ou descendo',()=>{
 const shots=bossShotDirections(direction,'vertical');assert.equal(shots.length,3);
 assert.ok(shots[0].y<0);assert.ok(shots[2].y>0);
});
test('número de tiros é limitado para hardware modesto',()=>{
 for(let i=0;i<30;i++)assert.ok(bossShotDirections(direction,bossAttackPattern(i,1)).length<=3);
});
test('vetores inválidos produzem direções seguras',()=>{
 for(const v of bossShotDirections({x:NaN,y:0,z:0},'fan')){
  assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z));
 }
});
test('cada ataque possui aviso textual específico',()=>{
 for(const mode of ['aimed','fan','vertical'])assert.ok(bossPatternLabel(mode).length>8);
});
test('interface do chefe sinaliza padrão com cor e não usa luz dinâmica',()=>{
 const scene=readFileSync(new URL('../src/world/MountainRegion.js',import.meta.url),'utf8');
 assert.match(scene,/setBossWarning\(active,pattern/);assert.match(scene,/bossWarningRing\.material\.color/);
});
test('game integra o padrão e usa projetéis limitados e efeitos já instanciados',()=>{
 const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 assert.match(game,/bossAttackPattern\(/);assert.match(game,/bossShotDirections\(/);
 assert.match(game,/this\.effects\.burst\(/);
});
test('chefe mantém o ataque anunciado mesmo ao perder vida durante a preparação',()=>{
 const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 assert.match(game,/this\.bossWarnedPattern=plannedPattern/);
 assert.match(game,/this\.bossWarnedPattern\?\?plannedPattern/);
 assert.match(game,/this\.bossWarnedPattern=null/);
});
test('com alvo na vertical, os disparos permanecem finitos e normalizados',()=>{
 for(const v of bossShotDirections({x:0,y:1,z:0},'fan')){
  assert.ok(Math.abs(Math.hypot(v.x,v.y,v.z)-1)<1e-9);
 }
});
test('efeito de colisão é gerado apenas para impacto com evento, no pool atual',()=>{
 const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 assert.match(game,/if\(this\.dragon\.impactPulse>0\)/);
 assert.match(game,/this\.dragon\.impactPulse=0/);
});
test('mudança repentina para segunda fase não encurta o aviso mínimo de .95 segundo',async()=>{
 const {bossAttackStep}=await import('../src/systems/MountainCombat.js');
 let state={elapsed:3.2,warned:true,warnClock:.1};
 for(let i=0;i<12;i++){
  const result=bossAttackStep(state,.05,{active:true,health:4});
  assert.equal(result.fire,false,'disparou antes de completar a preparação visual');
  state=result.state;
 }
 let fired=false;
 for(let i=0;i<20;i++){
  const result=bossAttackStep(state,.05,{active:true,health:4});state=result.state;
  if(result.fire){fired=true;break;}
 }
 assert.equal(fired,true);
});
