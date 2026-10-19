import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WildBonds,petRepeatAllowed,PET_COOLDOWN_SECONDS} from '../src/systems/WildBonds.js';
import {WildApproach} from '../src/systems/WildApproach.js';

test('after trust is complete petting stays eligible on a separate timer',()=>{
  const bonds=new WildBonds();
  for(const time of [0,2,4])assert.equal(bonds.bond('nimbo',time,true).ok,true);
  assert.equal(bonds.progress('nimbo'),3);
  assert.equal(bonds.bond('nimbo',7,true).ok,false);
  assert.equal(petRepeatAllowed(7,-Infinity),true);
  assert.equal(petRepeatAllowed(7+.2,7),false);
  assert.equal(petRepeatAllowed(7+PET_COOLDOWN_SECONDS,7),true);
  assert.equal(bonds.progress('nimbo'),3);
});
test('petting obeys calm and walking rules from original approach',()=>{
  const approach=new WildApproach();
  for(let t=0;t<3;t+=.05)approach.update('nimbo',.05,t,{distance:5,speed:0,riding:false});
  assert.equal(approach.ready('nimbo',5),true);
  approach.update('nimbo',.1,4,{distance:5,speed:12,riding:false});
  assert.equal(approach.ready('nimbo',5),false);
});
test('integration: tamed creatures appear for interactions without changing remaining',()=>{
  const wild=readFileSync(new URL('../src/entities/WildDragons.js',import.meta.url),'utf8');
  const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../src/ui/UI.js',import.meta.url),'utf8');
  assert.match(wild,/nearby\(position,limit=8,includeTamed=false\)/);
  assert.match(wild,/includeTamed\?this\.creatures:this\.remaining/);
  assert.match(wild,/petRepeatAllowed\(time,creature\.lastPetAt\)/);
  assert.match(game,/this\.wildDragons\.nearby\(this\.hero\.group\.position,8\.2,true\)/);
  assert.match(ui,/wildDragons\.nearby\(hero\.group\.position,8\.2,true\)/);
  assert.match(game,/this\.wildBonds\.progress\(creature\.spec\.id\)>=3/);
});
test('shadow type uses PCF supported by current Three.js',()=>{
  const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
  assert.match(game,/shadowMap\.type=THREE\.PCFShadowMap/);
  assert.doesNotMatch(game,/shadowMap\.type=THREE\.PCFSoftShadowMap/);
});
