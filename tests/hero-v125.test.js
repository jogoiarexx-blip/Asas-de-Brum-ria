import test from 'node:test';
import assert from 'node:assert/strict';
import {walkIntent,poseForHero} from '../src/entities/heroMotion.js';
import {readFileSync} from 'node:fs';

test('movimento analógico diagonal evita velocidade acima de 100%',()=>{
 const dir=walkIntent(1,1);assert.ok(Math.hypot(dir.x,dir.z)<=1.00001);
});
test('entrada analógica fraca produz caminhada lenta',()=>{
 const dir=walkIntent(.28,0);assert.ok(dir.strength<.4&&dir.strength>.2);
});
test('personagem parado tem braços e pernas sem oscilação',()=>{
 const p=poseForHero(0,0,false,false);assert.equal(p.stride,0);assert.equal(p.sway,0);
});
test('corrida muda o balanço e capa em relação à caminhada',()=>{
 const walk=poseForHero(1,.55,false,false),run=poseForHero(1,.55,false,true);
 assert.ok(run.stride>walk.stride);assert.ok(run.cape>walk.cape);
});
test('montaria mantém joelhos flexionados e braços para segurar a sela',()=>{
 const pose=poseForHero(3,1,true,false);assert.ok(pose.knee>0);assert.ok(pose.arm<0);
});
test('visual do personagem está em módulo independente do movimento',()=>{
 const hero=readFileSync(new URL('../src/entities/Hero.js',import.meta.url),'utf8');
 assert.match(hero,/from '\.\/heroVisual\.js'/);assert.match(hero,/from '\.\/heroMotion\.js'/);
});
