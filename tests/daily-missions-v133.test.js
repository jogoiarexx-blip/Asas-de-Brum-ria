import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceDayCycle,normalizeDayCycle,DAY_SECONDS,advanceClockHours} from '../src/systems/dayCycleMath.js';
import {VillageContracts,CONTRACTS} from '../src/systems/VillageContracts.js';
import {normalizeSave} from '../src/systems/SaveSystem.js';
import {Progression} from '../src/systems/Progression.js';

test('tempo registra novos dias, incluindo grande salto, sem perder o horário',()=>{
  const next=advanceDayCycle({phase:.96,day:4},DAY_SECONDS*.13);
  assert.equal(next.day,5);assert.ok(Math.abs(next.phase-.09)<1e-8);
  const twice=advanceDayCycle({phase:.13,day:5},DAY_SECONDS*2);
  assert.equal(twice.day,7);assert.ok(Math.abs(twice.phase-.13)<1e-9);
});
test('atalho N avança três horas e atravessa para o dia seguinte',()=>{
  const after=advanceClockHours({phase:.96,day:3},3);
  assert.equal(after.day,4);assert.ok(after.phase<.2);
});
test('partidas antigas sem dia continuam no primeiro dia',()=>{
  assert.equal(normalizeDayCycle({phase:.4}).day,1);
  const saved=normalizeSave({version:1,mission:{stage:5,progress:1},progression:new Progression().snapshot(),dayNight:{phase:.98}});
  assert.equal(saved.dayNight.day,1);
});
test('novos contratos incluem forja e socorro aos animais, sem remover os anteriores',()=>{
  assert.ok(CONTRACTS.correio&&CONTRACTS.ervas&&CONTRACTS.minérios&&CONTRACTS.socorro);
  for(const contract of Object.values(CONTRACTS))assert.equal(contract.points.length,3);
});
test('contratos concluídos são liberados somente no novo dia',()=>{
  const c=new VillageContracts(null,2);
  assert.equal(c.talk('iara').action,'accepted');
  for(let i=0;i<3;i++)assert.equal(c.collect('correio',i,true),true);
  assert.equal(c.talk('iara').action,'reward');
  assert.equal(c.talk('iara').action,'done');
  assert.equal(c.syncDay(2),false);
  assert.equal(c.state.correio.status,'done');
  assert.equal(c.syncDay(3),true);
  assert.equal(c.state.correio.status,'idle');
  assert.equal(c.talk('iara').action,'accepted');
});
test('contrato ativo não perde objetivos coletados na virada do dia',()=>{
  const c=new VillageContracts(null,1);c.talk('lume');c.collect('ervas',0,false);
  c.syncDay(2);
  assert.equal(c.state.ervas.status,'active');
  assert.deepEqual(c.state.ervas.collected,[true,false,false]);
});
test('dia do contrato é salvo e protegido contra retrocesso ao carregar save',()=>{
  const original=new VillageContracts(null,8);original.talk('iara');
  const snapshot=original.snapshot();
  const loaded=new VillageContracts(snapshot,2);
  assert.equal(loaded.day,8);
  assert.equal(loaded.state.correio.status,'active');
  loaded.syncDay(6);assert.equal(loaded.day,8);
});
test('rotas alternativas mudam por dia, de maneira determinística',()=>{
  const c=new VillageContracts(null,2);
  const day2=c.points('correio').map(p=>[...p]);
  c.syncDay(3);const day3=c.points('correio');
  assert.notDeepEqual(day2,day3);
  assert.deepEqual(c.points('correio'),day3);
});
