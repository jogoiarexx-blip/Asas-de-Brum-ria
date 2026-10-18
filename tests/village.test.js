import test from 'node:test';
import assert from 'node:assert/strict';
import {VillageContracts,CONTRACTS} from '../src/systems/VillageContracts.js';
import {CIRCUITS} from '../src/systems/TrainingConfig.js';
import {SaveSystem,normalizeSave} from '../src/systems/SaveSystem.js';
import {Progression} from '../src/systems/Progression.js';

test('contratos oferecem duas atividades distintas com três objetivos e recompensa válida',()=>{
  assert.deepEqual(Object.keys(CONTRACTS),['correio','ervas','minérios','socorro','patrulha']);
  assert.equal(CONTRACTS.correio.requiresMount,true);
  assert.equal(CONTRACTS.ervas.requiresMount,false);
  for(const contract of Object.values(CONTRACTS)){
    assert.equal(contract.points.length,3);
    assert.ok(contract.points.every(p=>p.length===3&&p.every(Number.isFinite)));
    assert.ok(contract.reward>0);
  }
});
test('correio requer montaria e entrega final ao NPC',()=>{
  const tasks=new VillageContracts();
  assert.equal(tasks.collect('correio',0,true),false);
  assert.equal(tasks.talk('iara').action,'accepted');
  assert.equal(tasks.talk('iara').action,'reminder');
  assert.equal(tasks.collect('correio',0,false),false);
  assert.equal(tasks.collect('correio',0,true),true);
  assert.equal(tasks.collect('correio',0,true),false);
  assert.equal(tasks.collect('correio',1,true),true);
  assert.equal(tasks.collect('correio',2,true),true);
  assert.equal(tasks.state.correio.status,'ready');
  assert.equal(tasks.talk('iara').reward,2);
  assert.equal(tasks.state.correio.status,'done');
  assert.equal(tasks.talk('iara').action,'done');
});
test('ervas são coletadas exclusivamente a pé e salvamento retoma tarefas parcialmente concluídas',()=>{
  const tasks=new VillageContracts();tasks.talk('lume');
  assert.equal(tasks.collect('ervas',0,true),false);
  assert.equal(tasks.collect('ervas',0,false),true);
  const resumed=new VillageContracts(tasks.snapshot());
  assert.deepEqual(resumed.snapshot(),tasks.snapshot());
  assert.equal(resumed.collect('ervas',1,false),true);
  assert.equal(resumed.collect('ervas',2,false),true);
  assert.equal(resumed.talk('lume').reward,1);
});
test('estado de contratos inválido não concede prêmio nem desbloqueia missão',()=>{
  const tasks=new VillageContracts({correio:{status:'hacked',collected:[true,true,true]},ervas:{status:'ready',collected:[]}});
  assert.equal(tasks.state.correio.status,'idle');
  assert.equal(tasks.talk('iara').action,'accepted');
  assert.equal(tasks.talk('borin').action,'accepted');
  assert.deepEqual(tasks.state.ervas.collected,[true,true,true]);
  assert.equal(tasks.talk('lume').reward,1);
});
test('circuito avançado tem mais obstáculos, menos tempo, velocidade e pontos maiores',()=>{
  assert.equal(CIRCUITS.basic.checkpoints.length,3);
  assert.equal(CIRCUITS.advanced.checkpoints.length,5);
  assert.ok(CIRCUITS.advanced.seconds<CIRCUITS.basic.seconds);
  assert.ok(CIRCUITS.advanced.reward>CIRCUITS.basic.reward);
  assert.ok(CIRCUITS.advanced.minSpeed>0);
});
test('saves antigos continuam compatíveis e preservam os novos contratos',()=>{
  const old={version:1,mission:{stage:5,progress:1},progression:new Progression().snapshot(),player:{health:85}};
  assert.equal(normalizeSave(old).contracts,null);
  const storage=new Map();const repo=new SaveSystem({getItem:key=>storage.get(key),setItem:(k,v)=>storage.set(k,v),removeItem:key=>storage.delete(key)});
  const contracts=new VillageContracts();contracts.talk('iara');contracts.collect('correio',0,true);
  const payload={...old,contracts:contracts.snapshot()};
  assert.ok(repo.write(payload));
  const reloaded=new VillageContracts(repo.read().contracts);
  assert.equal(reloaded.state.correio.status,'active');
  assert.deepEqual(reloaded.state.correio.collected,[true,false,false]);
});
