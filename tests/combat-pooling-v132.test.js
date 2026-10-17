import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ReusableSlots} from '../src/systems/ReusableSlots.js';

test('efeitos são pré-alocados e disparos não geram novas partículas',()=>{
  let allocations=0;
  const pool=new ReusableSlots(6,()=>({id:++allocations}));
  assert.equal(allocations,6);
  assert.equal(pool.free.length,6);
  for(let i=0;i<6;i++)assert.ok(pool.take());
  assert.equal(pool.take(),null);
  assert.equal(allocations,6);
  assert.equal(pool.active.length,6);
  pool.releaseAt(2);pool.releaseAt(0);pool.take();pool.take();
  assert.equal(allocations,6);
  assert.equal(pool.active.length,6);
});

test('efeitos liberados durante queda e redução de qualidade retornam ao pool',()=>{
 const pool=new ReusableSlots(10,()=>({}));
 for(let i=0;i<9;i++)pool.take();
 pool.trim(3);
 assert.equal(pool.active.length,3);assert.equal(pool.free.length,7);
 pool.trim(0);assert.equal(pool.active.length,0);assert.equal(pool.free.length,10);
 assert.equal(pool.take(),pool.active[0]);
});

test('pool não ultrapassa sua capacidade mesmo com tamanho inválido',()=>{
 assert.throws(()=>new ReusableSlots(-1,()=>({})),/capacity/i);
 assert.throws(()=>new ReusableSlots(2.3,()=>({})),/capacity/i);
 const pool=new ReusableSlots(0,()=>({}));assert.equal(pool.take(),null);
});

test('partículas e projéteis reutilizam slots e vetores durante tiroteio',()=>{
 const effect=readFileSync(new URL('../src/systems/Effects.js',import.meta.url),'utf8');
 const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 assert.match(effect,/ReusableSlots/);
 assert.match(effect,/bucket\.pool\.take\(/);
 assert.doesNotMatch(effect,/position\.clone\(\)/);
 assert.match(game,/this\.projectilePool\.push\(bullet\)/);
 assert.match(game,/bullet\.velocity\.copy\(direction\)/);
 assert.doesNotMatch(game,/velocity:direction\.clone\(\)/);
});

test('20 mil disparos e expiramentos de partículas não alocam objetos extras',()=>{
 let created=0;
 const pool=new ReusableSlots(24,()=>({id:created++}));
 for(let i=0;i<20_000;i++){
   const used=pool.take();assert.ok(used);
   pool.releaseAt(pool.active.length-1);
 }
 assert.equal(created,24);assert.equal(pool.active.length,0);
});

test('todos os slots permanecem únicos após remoções fora de ordem',()=>{
 const pool=new ReusableSlots(50,i=>({id:i}));
 for(let i=0;i<50;i++)pool.take();
 pool.releaseAt(5);pool.releaseAt(25);pool.releaseAt(0);
 for(let i=0;i<3;i++)pool.take();
 assert.equal(new Set(pool.active.map(x=>x.id)).size,50);
});

test('projéteis são pré-aquecidos até o limite detalhado para evitar alocação no primeiro tiro',()=>{
 const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 assert.match(game,/for\(let i=0;i<projectileLimit\('quality'\);i\+\+\)/);
 assert.match(game,/this\.projectilePool\.push\(\{mesh:new THREE\.Mesh/);
});
