import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CONTRACTS,VillageContracts} from '../src/systems/VillageContracts.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('Chamas dos Faróis tem três alvos de fogo, nova moradora e recompensa',()=>{
 const def=CONTRACTS.brasas;
 assert.equal(def.npc,'suri');assert.equal(def.requiresFire,true);
 assert.equal(def.requiresMount,true);assert.equal(def.points.length,3);
 assert.equal(def.reward,3);
});
test('sobrevoar um farol não acende baliza sem fogo',()=>{
 const c=new VillageContracts();c.talk('suri');
 for(const riding of [true,false])assert.equal(c.collect('brasas',0,riding),false);
 assert.deepEqual(c.state.brasas.collected,[false,false,false]);
});
test('não permite acender antes de aceitar ou acender repetidamente',()=>{
 const c=new VillageContracts();
 assert.equal(c.ignite('brasas',0),false);
 assert.equal(c.talk('suri').action,'accepted');
 assert.equal(c.ignite('brasas',0),true);
 assert.equal(c.ignite('brasas',0),false);
});
test('três sopros exigem retorno à moradora para dar prêmio único',()=>{
 const c=new VillageContracts();c.talk('suri');
 for(let i=0;i<3;i++)assert.equal(c.ignite('brasas',i),true);
 assert.equal(c.state.brasas.status,'ready');
 assert.equal(c.talk('suri').reward,3);
 assert.equal(c.talk('suri').action,'done');
});
test('missão ativa resiste à virada do dia; missão concluída reabre amanhã',()=>{
 const c=new VillageContracts(null,2);c.talk('suri');c.ignite('brasas',0);
 c.syncDay(3);
 assert.equal(c.state.brasas.status,'active');assert.equal(c.state.brasas.collected[0],true);
 c.ignite('brasas',1);c.ignite('brasas',2);c.talk('suri');c.syncDay(4);
 assert.equal(c.state.brasas.status,'idle');
 assert.deepEqual(c.state.brasas.collected,[false,false,false]);
});
test('salvamento recupera progresso parcial e os dias',()=>{
 const a=new VillageContracts(null,5);a.talk('suri');a.ignite('brasas',1);
 const b=new VillageContracts(a.snapshot(),5);
 assert.deepEqual(b.state.brasas.collected,[false,true,false]);
 assert.equal(b.ignite('brasas',1),false);
 assert.equal(b.ignite('brasas',2),true);
});
test('índices inválidos e contratos alheios não recebem fogo',()=>{
 const c=new VillageContracts();c.talk('suri');
 for(const index of [-1,3,NaN,Infinity,1.5])assert.equal(c.ignite('brasas',index),false);
 assert.equal(c.ignite('correio',0),false);
});
test('Suri e braseiros têm representação visual distinta de coletáveis',()=>{
 const s=source('../src/entities/VillageNPCs.js');
 assert.match(s,/id:'suri'/);assert.match(s,/requiresFire/);
 assert.match(s,/beaconFlame/);assert.match(s,/brasas:0xff985c/);
});
test('fogo usa varredura 3D e salva o avanço dos faróis',()=>{
 const game=source('../src/game/Game.js');
 assert.match(game,/segmentSphereHit\(from,to,marker\.group\.position,5\.4\)/);
 assert.match(game,/this\.contracts\.ignite\(marker\.id,marker\.index\)/);
 assert.match(game,/this\.saveGame\(\)/);
});
test('flores de cenário são instanciadas e não criam novas colisões',()=>{
 const s=source('../src/world/World.js');
 assert.match(s,/buildWildflowers\(\)/);
 assert.match(s,/new THREE\.InstancedMesh\(geometry,material,maximum\)/);
 const block=s.split('  buildWildflowers(){')[1].split('  buildVillageProps()')[0];
 assert.doesNotMatch(block,/addObstacle/);
});
test('flores respeitam qualidade da GPU, e HUD explica o sopro',()=>{
 const world=source('../src/world/World.js');
 assert.match(world,/this\.detailTier!=='economy'/);
 assert.match(world,/this\.detailTier==='balanced'\?Math\.ceil/);
 const guide=source('../src/systems/ObjectiveGuidance.js');
 assert.match(guide,/activeContractType==='brasas'/);
 const ui=source('../src/ui/UI.js');
 assert.match(ui,/contract\.requiresFire/);
});
