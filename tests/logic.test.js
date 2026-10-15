import test from 'node:test';
import assert from 'node:assert/strict';
import {clamp,approach,seededRandom,forwardFromYaw,smoothFollow} from '../src/utils/math.js';
import {shortestAngle,limitedTurn,pursuitYaw,segmentSphereHit,segmentPointDistanceSquared} from '../src/systems/combatMath.js';
import {ISLANDS,QUEST_DEFS,RING_POSITIONS,CRYSTAL_POSITIONS,TARGET_POSITIONS,HATCHLING_POSITIONS} from '../src/world/config.js';
test('energia e velocidade respeitam limites',()=>{
  assert.equal(clamp(150,0,100),100);assert.equal(clamp(-3,0,100),0);
  assert.equal(approach(3,20,5),8);assert.equal(approach(15,0,5),10);
});
test('curva de câmera está dentro do intervalo',()=>{assert.ok(smoothFollow(3,0.02)>0&&smoothFollow(3,0.02)<1);});
test('frente do dragão com yaw zero aponta para -Z',()=>{
  const v=forwardFromYaw(0);assert.ok(Math.abs(v.x)<1e-8);assert.equal(v.z,-1);
});
test('gerador de ilhas possui semente reproduzível',()=>{
  const a=seededRandom(500),b=seededRandom(500);for(let i=0;i<20;i++)assert.equal(a(),b());
});
test('sete missões com objetivos dimensionados corretamente',()=>{
  assert.equal(QUEST_DEFS.length,7);
  assert.deepEqual(QUEST_DEFS.map(m=>m.id),['bond','rings','crystals','targets','battle','rescue','training']);
  assert.equal(QUEST_DEFS[1].total,RING_POSITIONS.length);
  assert.equal(QUEST_DEFS[2].total,CRYSTAL_POSITIONS.length);
  assert.equal(QUEST_DEFS[3].total,TARGET_POSITIONS.length);
  assert.equal(QUEST_DEFS[4].total,3);
  assert.equal(QUEST_DEFS[5].total,HATCHLING_POSITIONS.length);
  assert.equal(QUEST_DEFS[6].total,1);
});
test('objetivos se distribuem em alturas e locais válidos',()=>{
  assert.ok(ISLANDS.length>=4);
  for(const p of [...RING_POSITIONS,...CRYSTAL_POSITIONS,...TARGET_POSITIONS,...HATCHLING_POSITIONS]){
    assert.equal(p.length,3);assert.ok(p.every(Number.isFinite));assert.ok(p[1]>10);
  }
});
test('normalização de ângulos não causa giro completo na fronteira ±π',()=>{
  assert.ok(Math.abs(shortestAngle((Math.PI-.01)-(-Math.PI+.01)))<.03);
  assert.ok(Math.abs(shortestAngle((-.03)-(Math.PI*2-.03)))<1e-8);
  assert.ok(Math.abs(pursuitYaw({x:0,z:0},{x:0,z:-30}))<1e-9);
  assert.ok(Math.abs(limitedTurn(0,Math.PI,0.2))<=.201);
});
test('colisão contínua detecta projétil atravessando esfera em um frame',()=>{
  const from={x:-15,y:0,z:0},to={x:15,y:0,z:0};
  assert.equal(segmentSphereHit(from,to,{x:0,y:0,z:0},2),true);
  assert.equal(segmentSphereHit(from,to,{x:0,y:4,z:0},2),false);
  assert.equal(segmentSphereHit(from,to,{x:0,y:2,z:0},2),true);
});
test('colisão contínua trata segmento estacionário sem dividir por zero',()=>{
  const p={x:1,y:1,z:1};
  assert.equal(segmentPointDistanceSquared(p,p,{x:1,y:1,z:3}),4);
  assert.equal(segmentSphereHit(p,p,{x:1,y:1,z:3},2),true);
});
