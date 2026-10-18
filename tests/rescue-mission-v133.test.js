import test from 'node:test';
import assert from 'node:assert/strict';
import {rescueApproach,deliveryReady,RESCUE_HOVER_SECONDS,RESCUE_NEST} from '../src/systems/RescueRules.js';
import {readFileSync} from 'node:fs';

test('resgatar filhote exige aproximação cuidadosa e voo estável',()=>{
  assert.equal(rescueApproach({distance:8,speed:6,riding:true,dt:.05,hold:0}),.05);
  assert.equal(rescueApproach({distance:8,speed:29,riding:true,dt:1,hold:.7}),0);
  assert.equal(rescueApproach({distance:12,speed:3,riding:true,dt:1,hold:.5}),0);
  assert.equal(rescueApproach({distance:6,speed:0,riding:false,dt:1,hold:.6}),0);
  assert.ok(RESCUE_HOVER_SECONDS>=1);
});
test('transporte requer pouso suave próximo ao ninho',()=>{
  assert.equal(deliveryReady({distance:8,speed:7,riding:true}),true);
  assert.equal(deliveryReady({distance:8,speed:30,riding:true}),false);
  assert.equal(deliveryReady({distance:20,speed:7,riding:true}),false);
  assert.equal(deliveryReady({distance:8,speed:7,riding:false}),false);
  assert.equal(RESCUE_NEST.length,3);
});
test('missão possui estado de transporte serializado e destino dinâmico',()=>{
  const source=readFileSync(new URL('../src/systems/Missions.js',import.meta.url),'utf8');
  assert.match(source,/carriedIndex/);
  assert.match(source,/rescueHold/);
  assert.match(source,/deliveryReady\(/);
  assert.match(source,/rescueApproach\(/);
  assert.match(source,/this\.nest/);
});
test('save conhece filhote transportado sem prejudicar saves antigos',()=>{
  const source=readFileSync(new URL('../src/systems/SaveSystem.js',import.meta.url),'utf8');
  assert.match(source,/carriedIndex/);
});
