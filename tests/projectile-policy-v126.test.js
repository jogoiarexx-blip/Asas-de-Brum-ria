import test from 'node:test';
import assert from 'node:assert/strict';
import {projectileAdmission} from '../src/systems/ProjectilePolicy.js';
import {projectileLimit} from '../src/systems/PerformanceBudget.js';
import {readFileSync} from 'node:fs';
test('sessão cheia de tiros inimigos não impede disparo do jogador',()=>{
 const cap=projectileLimit('economy');
 const live=Array.from({length:cap},()=>({owner:'enemy'}));
 assert.deepEqual(projectileAdmission(live,'player',cap),{allowed:true,evictIndex:0});
});
test('inimigo nunca remove projétil de jogador',()=>{
 const cap=projectileLimit('economy');const live=Array.from({length:cap},()=>({owner:'player'}));
 assert.deepEqual(projectileAdmission(live,'enemy',cap),{allowed:false,evictIndex:-1});
});
test('disparos de jogador não excedem o orçamento quando não há inimigo para remover',()=>{
 const cap=projectileLimit('economy');const live=Array.from({length:cap},()=>({owner:'player'}));
 assert.deepEqual(projectileAdmission(live,'player',cap),{allowed:false,evictIndex:-1});
});
test('sob a capacidade, tanto fogo quanto projétil inimigo podem ser criados',()=>{
 assert.deepEqual(projectileAdmission([{owner:'player'}],'enemy',12),{allowed:true,evictIndex:-1});
 assert.deepEqual(projectileAdmission([],'player',12),{allowed:true,evictIndex:-1});
});
test('capacidade inválida não permite gerar objetos infinitos',()=>{
 assert.equal(projectileAdmission([],'player',NaN).allowed,false);
 assert.equal(projectileAdmission([],'enemy',-1).allowed,false);
});
test('integração usa decisão de admissão antes de alocar malha',()=>{
 const src=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 assert.match(src,/projectileAdmission\(this\.projectiles,owner,cap\)/);
 assert.match(src,/if\(!admission\.allowed\)return false/);
});
