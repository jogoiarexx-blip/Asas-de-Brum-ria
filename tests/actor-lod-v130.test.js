import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {actorLevel,shouldAnimateActor,sceneActorStats,withinCameraCone,actorVisualLevel} from '../src/systems/ActorLOD.js';
const source=(file)=>readFileSync(new URL(file,import.meta.url),'utf8');

test('personagem perto mantém animação em todos os perfis',()=>{
 for(const tier of ['economy','balanced','quality'])assert.equal(actorLevel(12,tier,'wild'),'full');
});
test('dragão selvagem distante reduz animações em modo leve',()=>{
 assert.equal(actorLevel(65,'economy','wild'),'limited');
 assert.equal(actorLevel(200,'economy','wild'),'hidden');
 assert.equal(actorLevel(65,'quality','wild'),'full');
});
test('sentinelas preservam visibilidade e combate a 155 m',()=>{
 for(const tier of ['economy','balanced','quality']){
  assert.notEqual(actorLevel(155,tier,'enemy'),'hidden');
 }
 assert.equal(actorLevel(420,'economy','enemy'),'hidden');
});
test('perfil detalhado não esconde personagens distantes por distância apenas',()=>{
 assert.notEqual(actorLevel(999,'quality','wild'),'hidden');
});
test('distância inválida nunca esconde personagem',()=>{
 assert.equal(actorLevel(NaN,'economy','wild'),'full');
 assert.equal(actorLevel(-2,'economy','wild'),'full');
});
test('personagens em média distância atualizam animação limitada a 10 fps',()=>{
 assert.equal(shouldAnimateActor('limited',.05),false);
 assert.equal(shouldAnimateActor('limited',.11),true);
 assert.equal(shouldAnimateActor('full',0),true);
 assert.equal(shouldAnimateActor('hidden',20),false);
});
test('câmera nunca elimina atores em raio de interação',()=>{
 assert.equal(withinCameraCone({x:0,z:0},{x:0,z:10},{x:0,z:-1},18),true);
});
test('cone conserva atores à frente e evita animação atrás da câmera',()=>{
 assert.equal(withinCameraCone({x:0,z:0},{x:0,z:-150},{x:0,z:-1},35),true);
 assert.equal(withinCameraCone({x:0,z:0},{x:0,z:150},{x:0,z:-1},35),false);
});
test('estatísticas do LOD separam visível e atualização visual',()=>{
 const x=sceneActorStats(['full','limited','hidden','limited']);
 assert.deepEqual(x,{visible:3,full:1,limited:2,hidden:1});
});
test('dragões selvagens aplicam LOD visual sem impedir humor de domesticação',()=>{
 const code=source('../src/entities/WildDragons.js');
 assert.match(code,/actorVisualLevel\(/);
 assert.match(code,/this\.approach\.update\(/);
 assert.match(code,/group\.visible=/);
 assert.match(code,/shouldAnimateActor\(/);
});
test('sentinelas continuam com AI ativa e limitam transformações distantes',()=>{
 const code=source('../src/entities/EnemyDragon.js');
 assert.match(code,/actorVisualLevel\(/);
 assert.match(code,/this\.active/);
 assert.match(code,/shouldAnimateActor\(/);
});
test('LOD usa a posição da câmera após movimentação e não mexe na física de colisão',()=>{
 const code=source('../src/game/Game.js');
 assert.match(code,/updateActorDetail\(/);
 assert.match(code,/this\.updateCamera\(dt\)/);
 assert.match(code,/renderDiagnostics\(fps\)/);
});
test('painel F3 mostra personagens renderizados e animações limitadas',()=>{
 const code=source('../src/systems/PerformanceDiagnostics.js');
 assert.match(code,/actorsVisible/);
 assert.match(code,/actorsLimited/);
});

test('sentinelas na área de combate têm atualização de IA em todo quadro',async()=>{
 const {enemySimulationStep}=await import('../src/systems/ActorLOD.js');
 for(const tier of ['economy','balanced','quality']){
  const tick=enemySimulationStep(153,0,.016,tier);
  assert.deepEqual(tick,{run:true,dt:.016,carry:0});
 }
});
test('patrulhas longínquas são atualizadas em lotes limitados, sem perder tempo',async()=>{
 const {enemySimulationStep}=await import('../src/systems/ActorLOD.js');
 const a=enemySimulationStep(420,0,.05,'economy');assert.equal(a.run,false);
 const b=enemySimulationStep(420,a.carry,.05,'economy');assert.equal(b.run,false);
 const c=enemySimulationStep(420,b.carry,.05,'economy');assert.equal(c.run,false);
 const d=enemySimulationStep(420,c.carry,.05,'economy');assert.equal(d.run,true);
 assert.ok(Math.abs(d.dt-.2)<1e-9);assert.equal(d.carry,0);
});
test('qualidade detalhada preserva simulação integral dos inimigos',async()=>{
 const {enemySimulationStep}=await import('../src/systems/ActorLOD.js');
 assert.equal(enemySimulationStep(1000,0,.016,'quality').run,true);
});
test('aproximação ao inimigo libera imediatamente tempo acumulado',async()=>{
 const {enemySimulationStep}=await import('../src/systems/ActorLOD.js');
 const a=enemySimulationStep(400,0,.09,'economy');
 const b=enemySimulationStep(160,a.carry,.016,'economy');
 assert.equal(b.run,true);assert.ok(Math.abs(b.dt-.106)<1e-9);
});
test('tempo extremo é limitado para evitar teleporte depois de aba suspensa',async()=>{
 const {enemySimulationStep}=await import('../src/systems/ActorLOD.js');
 const step=enemySimulationStep(400,20,15,'economy');
 assert.equal(step.run,true);assert.equal(step.dt,.25);assert.equal(step.carry,0);
});
test('controle de qualidade da simulação permanece independente do salvamento',()=>{
 const src=source('../src/entities/EnemyDragon.js');
 assert.match(src,/enemySimulationStep\(/);
 assert.match(src,/simulationCarry/);
 assert.match(src,/if\(step\.run\)enemy\.update/);
});
