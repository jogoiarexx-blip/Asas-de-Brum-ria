import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canDodge,startDodge,advanceDodge,dodgeImpulse,bossDamageStage,bossAimPoint,enemyFlank} from '../src/systems/AerialCombat.js';

const close=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('esquiva exige montaria e voo, não dispara a pé ou no chão',()=>{
  for(const [riding,airborne] of [[false,true],[true,false],[false,false]])
    assert.equal(canDodge({riding,airborne,energy:100,cooldown:0}),false);
  assert.equal(canDodge({riding:true,airborne:true,energy:100,cooldown:0}),true);
});
test('energia e recarga impedem spam da esquiva',()=>{
  assert.equal(canDodge({riding:true,airborne:true,energy:8,cooldown:0}),false);
  assert.equal(canDodge({riding:true,airborne:true,energy:100,cooldown:.3}),false);
  const d=startDodge({riding:true,airborne:true,energy:50,cooldown:0,axis:-1});
  assert.equal(d.ok,true); assert.ok(d.cost>=10);assert.equal(d.side,-1);
  const after=advanceDodge({remaining:d.duration,cooldown:d.cooldown},.2);
  assert.ok(after.remaining>0);assert.ok(after.cooldown>1);
  assert.equal(advanceDodge(after,20).remaining,0);
});
test('esquiva sem eixo alterna lado, evitando repetição involuntária',()=>{
  assert.equal(startDodge({riding:true,airborne:true,energy:50,cooldown:0,axis:0,previousSide:1}).side,-1);
  assert.equal(startDodge({riding:true,airborne:true,energy:50,cooldown:0,axis:0,previousSide:-1}).side,1);
});
test('impulso da esquiva é lateral e respeita o dt e duração restante',()=>{
  const p=dodgeImpulse(0,1,.1,.1);
  assert.ok(p.x>2&&p.x<4);close(p.z,0);
  const q=dodgeImpulse(Math.PI/2,1,.1,.1);
  close(q.x,0);assert.ok(q.z< -2);
  const r=dodgeImpulse(0,-1,.1,.02);
  assert.ok(r.x<0&&r.x>-1);
  assert.equal(dodgeImpulse(0,1,.1,0).x,0);
});
test('estado temporal da esquiva não fica negativo com pausas grandes',()=>{
  assert.deepEqual(advanceDodge({remaining:.05,cooldown:2},200),{remaining:0,cooldown:0});
});
test('chefe mostra 3 estágios de dano antes de ser derrotado',()=>{
  assert.equal(bossDamageStage(12),0);
  assert.equal(bossDamageStage(8),1);
  assert.equal(bossDamageStage(4),2);
  assert.equal(bossDamageStage(2),3);
  assert.equal(bossDamageStage(0),4);
});
test('dano inválido não cria estado infinito na malha do chefe',()=>{
  assert.equal(bossDamageStage(NaN),0);
  assert.equal(bossDamageStage(Infinity),0);
});
test('tiro do chefe prevê parte do movimento sem ser guiado no ar',()=>{
  const x=bossAimPoint({x:0,y:60,z:0},{x:60,y:53,z:0},{x:1,z:0},30);
  assert.ok(x.x>60&&x.x<74);close(x.y,53);close(x.z,0);
  const stopped=bossAimPoint({x:0,y:60,z:0},{x:60,y:53,z:0},{x:1,z:0},0);
  close(stopped.x,60);
});
test('interceptação limita antecipação para evitar ataques impossíveis',()=>{
  const target=bossAimPoint({x:0,y:0,z:0},{x:5000,y:10,z:0},{x:0,z:-1},120);
  assert.ok(target.z>=-12&&target.z<=0);
});
test('sentinelas flanqueiam sem atingir posição inválida',()=>{
  close(enemyFlank(220,4,0),0);
  const mid=enemyFlank(64,4,0);
  assert.ok(Number.isFinite(mid));assert.ok(Math.abs(mid)>0&&Math.abs(mid)<=15);
  assert.ok(Math.abs(enemyFlank(64,4,1)-mid)>.01);
});
test('esquiva está conectada aos controles, movimento e invulnerabilidade',()=>{
  const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
  const dragon=readFileSync(new URL('../src/entities/Dragon.js',import.meta.url),'utf8');
  const controller=readFileSync(new URL('../src/game/GamepadController.js',import.meta.url),'utf8');
  assert.match(game,/input\.consume\('q'\)/);
  assert.match(game,/dragon\.tryDodge\(/);
  assert.match(game,/dragon\.dodgeRemaining/);
  assert.match(dragon,/dodgeImpulse\(/);
  assert.match(dragon,/blockedHorizontal/);
  assert.match(controller,/11:'q'/);
});
test('marcas de dano aparecem na malha do chefe e acompanham golpes',()=>{
  const mountain=readFileSync(new URL('../src/world/MountainRegion.js',import.meta.url),'utf8');
  assert.match(mountain,/bossDamageStage\(/);
  assert.match(mountain,/bossDamageMarks/);
  assert.match(mountain,/bossHitFlash/);
});
test('sentinelas usam flanco e o chefe usa mira preditiva',()=>{
  const ai=readFileSync(new URL('../src/entities/EnemyDragon.js',import.meta.url),'utf8');
  const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
  assert.match(ai,/enemyCombatPlan\(/);
  assert.match(readFileSync(new URL('../src/systems/EnemyTactics.js',import.meta.url),'utf8'),/enemyFlank\(/);
  assert.match(game,/bossAimPoint\(/);
});

test('esquiva obedece as colisões da parede, sem atravessar casas',async()=>{
  const {moveFlightWithCollisions}=await import('../src/utils/spatialSweep.js');
  const wall={x:4,z:0,radius:2,shape:'box',halfWidth:1,halfDepth:6,bottom:0,top:16};
  const impulse=dodgeImpulse(0,1,.34,.34);
  const hit=moveFlightWithCollisions({x:0,y:9,z:0},{x:impulse.x,y:0,z:impulse.z},1.15,1.65,[wall],()=>-5);
  assert.equal(hit.blockedHorizontal,true);
  assert.ok(hit.x<2,`esquiva atravessou parede: ${hit.x}`);
});
test('esquiva mantém altitude e se move livre onde não há obstáculos',async()=>{
  const {moveFlightWithCollisions}=await import('../src/utils/spatialSweep.js');
  const impulse=dodgeImpulse(.3,-1,.24,.24);
  const result=moveFlightWithCollisions({x:0,y:40,z:0},{x:impulse.x,y:0,z:impulse.z},1.15,1.65,[],()=>0);
  assert.equal(result.blockedHorizontal,false);
  close(result.y,40);
  assert.ok(Math.hypot(result.x,result.z)>5);
});
test('configuração do gamepad reserva R3 para esquiva, sem repetir enquanto pressionado',async()=>{
  const {GamepadController}=await import('../src/game/GamepadController.js');
  const device={index:0,id:'Gamepad test',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},(_,i)=>({pressed:i===11,value:i===11?1:0}))};
  const c=new GamepadController();
  assert.equal(c.poll([device]).justPressed.has('q'),true);
  assert.equal(c.poll([device]).justPressed.has('q'),false);
});
test('estado de dano do chefe se recompõe a partir do progresso salvo',async()=>{
  const {ExpeditionProgress}=await import('../src/systems/ExpeditionRules.js');
  const save=new ExpeditionProgress({boatHealth:[0,0,0],bossHealth:4});
  assert.equal(save.phase,'boss');
  assert.equal(bossDamageStage(save.bossHealth),2);
  const load=new ExpeditionProgress(save.snapshot());
  assert.equal(bossDamageStage(load.bossHealth),2);
});


test('HUD oferece indicação de recarga da esquiva e orientação para teclado',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../src/ui/UI.js',import.meta.url),'utf8');
  assert.match(html,/id="dodge-status"/);
  assert.match(html,/ESQUIVAR \(VOANDO\)/);
  assert.match(ui,/this\.dodgeStatus\.textContent/);
});
