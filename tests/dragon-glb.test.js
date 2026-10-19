import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyDragonClip,dragonAnimationState,mapDragonClips,selectDragonClip} from '../src/entities/dragonClipMap.js';
import {readFileSync} from 'node:fs';

test('nomes de animações do GLB são reconhecidos sem inventar clipes',()=>{
  const clips=['Idle','Flying','Glide','Walking','Attack_01','Hurt','Land','Take Off']
    .map(name=>({name}));
  const slots=mapDragonClips(clips);
  for(const expected of ['idle','fly','glide','walk','attack','hurt','land','takeoff'])
    assert.ok(slots[expected],expected);
  assert.equal(classifyDragonClip('fly_cycle'),'fly');
  assert.equal(classifyDragonClip('Unknown Action'),null);
  assert.equal(selectDragonClip(slots,'attack').name,'Attack_01');
});
test('estados de gameplay escolhem a animação compatível',()=>{
  assert.equal(dragonAnimationState({pose:'takeoff',airborne:true}),'takeoff');
  assert.equal(dragonAnimationState({airborne:true,speed:32}),'fly');
  assert.equal(dragonAnimationState({airborne:true,speed:4}),'glide');
  assert.equal(dragonAnimationState({riding:true,speed:8}),'walk');
  assert.equal(dragonAnimationState({riding:false,speed:0}),'idle');
  assert.equal(dragonAnimationState({attackTime:.3,airborne:true}),'attack');
  assert.equal(dragonAnimationState({hurtTime:.4,attackTime:.3}),'hurt');
});
test('GLB com apenas um clip ou sem clip mantém visual opcional',()=>{
  const original={name:'Rest'},slots=mapDragonClips([original]);
  assert.equal(selectDragonClip(slots,'fly'),original);
  assert.equal(selectDragonClip(slots,'attack'),original);
  assert.equal(selectDragonClip({},'idle'),null);
});
test('integração não remove montaria, espécie nem geometria procedural',()=>{
  const dragon=readFileSync(new URL('../src/entities/Dragon.js',import.meta.url),'utf8');
  const hero=readFileSync(new URL('../src/entities/Hero.js',import.meta.url),'utf8');
  const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
  const loader=readFileSync(new URL('../src/entities/dragonAssetLoader.js',import.meta.url),'utf8');
  assert.match(hero,/dragon\.rider=this\.rider/);
  assert.match(dragon,/updateDragonGLB\(this,dt\)/);
  assert.match(dragon,/if\(accents\.has\(record\.obj\)\)record\.visible=/);
  assert.match(loader,/dragon\.visual\.children/);
  assert.match(loader,/obj!==dragon\.rider/);
  assert.match(loader,/for\(const \{obj,visible\} of data\.original\)obj\.visible=visible/);
  assert.match(game,/new DragonAssetUI\(this\.dragon\)/);
});
