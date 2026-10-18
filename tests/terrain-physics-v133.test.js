import test from 'node:test';
import assert from 'node:assert/strict';
import {groundFollow,terrainLean} from '../src/utils/groundPhysics.js';
import {readFileSync} from 'node:fs';
test('pernas seguem descida de degrau com gravidade limitada, não teleporte',()=>{
  const a=groundFollow({y:8,velocity:0,target:4,dt:.05});
  assert.ok(a.y<8 && a.y>6);assert.ok(a.velocity<0);
  const b=groundFollow({y:a.y,velocity:a.velocity,target:4,dt:.05});
  assert.ok(b.y<a.y && b.y>=4);
});
test('subida após passagem válida sobe imediatamente e zera a velocidade de queda',()=>{
  const out=groundFollow({y:4,velocity:-10,target:4.6,dt:.05});
  assert.deepEqual(out,{y:4.6,velocity:0});
});
test('gravidade não atravessa o terreno em quadros lentos',()=>{
  const out=groundFollow({y:30,velocity:-100,target:12,dt:1});
  assert.ok(out.y>=12);assert.ok(out.velocity>=-20);
});
test('terreno inclinado gera leve inclinação, terreno plano não inclina',()=>{
  assert.deepEqual(terrainLean(0,0,()=>5),{pitch:0,roll:0});
  const tilted=terrainLean(0,0,(x,z)=>2+x*.5+z*.35);
  assert.ok(Math.abs(tilted.pitch)>.01 && Math.abs(tilted.roll)>.01);
  assert.ok(Math.abs(tilted.pitch)<=.14 && Math.abs(tilted.roll)<=.14);
});
test('física está integrada ao personagem sem romper colisões existentes',()=>{
  const source=readFileSync(new URL('../src/entities/Hero.js',import.meta.url),'utf8');
  assert.match(source,/groundFollow\(/);
  assert.match(source,/terrainLean\(/);
  assert.match(source,/moveWithCollisions\(/);
});
