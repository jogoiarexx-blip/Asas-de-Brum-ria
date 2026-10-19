import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hatchlingPose,wildDragonPose} from '../src/entities/CreatureMotion.js';
import {WildBonds} from '../src/systems/WildBonds.js';
import {rescueApproach,deliveryReady} from '../src/systems/RescueRules.js';

test('três filhotes têm poses estáveis com olhos e asas animados',()=>{
  for(let index=0;index<3;index++)for(let frame=0;frame<500;frame++){
    const a=hatchlingPose(frame/60,index,false);
    for(const field of ['breath','headPitch','headRoll','tailYaw','wingFlap','eyeOpen'])
      assert.ok(Number.isFinite(a[field]),field);
    assert.ok(a.eyeOpen>=.09&&a.eyeOpen<=1);
    assert.ok(Math.abs(a.wingFlap)<=.18);
  }
});

test('filhote transportado bate asas mais rápido sem mudar regras de resgate',()=>{
  const baby=hatchlingPose(.31,0,false);
  const carried=hatchlingPose(.31,0,true);
  assert.notEqual(baby.headPitch,carried.headPitch);
  assert.ok(Math.abs(carried.wingFlap)<=.28);
  let hold=0;
  for(let i=0;i<25;i++)hold=rescueApproach({distance:5,speed:8,riding:true,dt:.05,hold});
  assert.equal(hold,1.25);
  assert.equal(deliveryReady({distance:9,speed:5,riding:true}),true);
  assert.equal(deliveryReady({distance:9,speed:19,riding:true}),false);
});

test('carinho produz reação visual temporária com olhos semicerrados e cauda',()=>{
  const base={time:.4,phase:1,mood:'observando',near:true};
  const idle=wildDragonPose(base);
  const pet=wildDragonPose({...base,petTime:1.25});
  assert.ok(pet.headPitch<idle.headPitch);
  assert.ok(pet.eyeOpen<=idle.eyeOpen);
  assert.ok(pet.affection>idle.affection);
  for(const field of ['headPitch','headRoll','tailYaw','tailPitch','ears','eyeOpen','jawOpen','breath','wingsRelax'])
    assert.ok(Number.isFinite(pet[field]),field);
  assert.ok(pet.eyeOpen>=.10&&pet.eyeOpen<=1);
  assert.equal(wildDragonPose({...base,petTime:0}).affection,0);
});

test('reação visual não concede pontos nem altera cooldown do carinho',()=>{
  const bonds=new WildBonds();
  assert.equal(bonds.bond('nimbo',0,true).ok,true);
  assert.equal(bonds.bond('nimbo',.3,true).ok,false);
  wildDragonPose({time:10,mood:'tranquilo',petTime:1.2});
  assert.equal(bonds.progress('nimbo'),1);
  assert.equal(bonds.bond('nimbo',2.0,true).ok,true);
});

test('modelos preservam contrato de resgate e acoplamento ao carinho',()=>{
  const missions=readFileSync(new URL('../src/systems/Missions.js',import.meta.url),'utf8');
  const wild=readFileSync(new URL('../src/entities/WildDragons.js',import.meta.url),'utf8');
  const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
  assert.match(missions,/buildHatchling\(i\)/);
  assert.match(missions,/animateHatchling\(baby/);
  assert.match(missions,/baby\.userData\.rescued/);
  assert.match(missions,/this\.carriedIndex/);
  assert.match(wild,/onPetted\(id\)/);
  assert.match(game,/this\.wildDragons\.onPetted\(creature\.spec\.id\)/);
});
