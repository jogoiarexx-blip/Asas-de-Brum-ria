import test from 'node:test';
import assert from 'node:assert/strict';
import {poseForHero} from '../src/entities/heroMotion.js';
import {readFileSync} from 'node:fs';

test('respiração do herói é discreta e permanece ativa parado',()=>{
 const a=poseForHero(0,0,false,false);
 const b=poseForHero(Math.PI/2,0,false,false);
 assert.ok(Math.abs(a.breath-b.breath)>0.001);
 assert.equal(a.stride,0);assert.equal(b.stride,0);
});
test('passo correndo eleva os pés mais que caminhada',()=>{
 const walk=poseForHero(4,1,false,false);
 const run=poseForHero(4,1,false,true);
 assert.ok(run.footLift>walk.footLift);
});
test('montaria não executa animação de corrida do herói',()=>{
 const rider=poseForHero(4,1,true,true);
 assert.equal(rider.stride,0);
 assert.equal(rider.footLift,0);
});
test('personagem tem pivô de cabeça para olhar sem mover a câmera',()=>{
 const visual=readFileSync(new URL('../src/entities/heroVisual.js',import.meta.url),'utf8');
 const hero=readFileSync(new URL('../src/entities/Hero.js',import.meta.url),'utf8');
 assert.match(visual,/g\.userData=\{legs,arms,cape,body,head\}/);
 assert.match(hero,/head\.rotation\.y/);
});
