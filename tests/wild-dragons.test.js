import test from 'node:test';
import assert from 'node:assert/strict';
import {WILD_DRAGON_DEFS, WildBonds, normalizeWildBonds} from '../src/systems/WildBonds.js';
import {normalizeSave} from '../src/systems/SaveSystem.js';
import {Progression} from '../src/systems/Progression.js';
const ids=['brasa','raio','nimbo'];
test('três dragões selvagens com ilhas, personalidades e espécies conhecidas',()=>{
  assert.equal(WILD_DRAGON_DEFS.length,3);
  assert.deepEqual(WILD_DRAGON_DEFS.map(d=>d.id),ids);
  for(const d of WILD_DRAGON_DEFS){assert.ok(d.x!==0&&d.z!==0);assert.ok(d.temperament);}
});
test('primeiro vínculo e repetição curta não multiplicam carinho',()=>{
  const b=new WildBonds();
  assert.deepEqual(b.bond('brasa',0),{ok:true,progress:1,completed:false});
  assert.equal(b.bond('brasa',.1).ok,false);
  assert.equal(b.progress('brasa'),1);
  assert.equal(b.bond('brasa',1.9).progress,2);
});
test('domesticação acontece uma vez e não gera recompensas duplicadas',()=>{
  const b=new WildBonds();
  b.bond('raio',10);b.bond('raio',12);
  const final=b.bond('raio',14);
  assert.equal(final.completed,true);
  assert.equal(b.bond('raio',16).ok,false);
  assert.equal(b.total,1);
});
test('montado, espécie inválida e tempo inválido não avançam vínculo',()=>{
  const b=new WildBonds();
  assert.equal(b.bond('nimbo',1,false).ok,false);
  assert.equal(b.bond('outro',1).ok,false);
  assert.equal(b.bond('nimbo',NaN).ok,false);
  assert.equal(b.total,0);
});
test('restaura e limita progresso vindo de arquivo corrompido',()=>{
  const b=new WildBonds({brasa:100,raio:-8,nimbo:2.4,extra:3});
  assert.deepEqual(b.snapshot(),{brasa:3,raio:0,nimbo:0});
  assert.equal(b.total,1);
});
test('vínculo parcial salvo continua sem travar pela recarga anterior',()=>{
  const b=new WildBonds({brasa:2});
  assert.equal(b.bond('brasa',0).completed,true);
});
test('salvamento v1 antigo recebe vínculos vazios e o novo preserva conclusão',()=>{
  const sample={version:1,mission:{stage:0},progression:{},player:{}};
  assert.deepEqual(normalizeSave(sample).wildBonds,{brasa:0,raio:0,nimbo:0});
  const updated=normalizeSave({...sample,wildBonds:{brasa:3,raio:1}});
  assert.deepEqual(updated.wildBonds,{brasa:3,raio:1,nimbo:0});
});
test('espécies amansadas são desbloqueadas sem cobrar pontos uma segunda vez',()=>{
  const p=new Progression();
  p.grant(2);
  assert.equal(p.discover('brasa'),true);
  assert.equal(p.discover('brasa'),false);
  assert.equal(p.points,2);
  assert.ok(p.unlocked.includes('brasa'));
  assert.equal(p.discover('naoexiste'),false);
});
