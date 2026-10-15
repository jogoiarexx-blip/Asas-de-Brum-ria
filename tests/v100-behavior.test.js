import test from 'node:test';
import assert from 'node:assert/strict';
import {WildApproach,APPROACH_RULES} from '../src/systems/WildApproach.js';
import {landingDescent,smoothedTurn} from '../src/entities/flightHandling.js';

const step=(a,id,t,{distance=5,speed=0,riding=false}={})=>a.update(id,.25,t,{distance,speed,riding});
test('temperamentos exigem aproximações diferentes e calma progressiva',()=>{
  const a=new WildApproach();
  assert.ok(APPROACH_RULES.nimbo.seconds>APPROACH_RULES.brasa.seconds);
  for(let t=.25;t<1.5;t+=.25)step(a,'brasa',t);
  assert.equal(a.ready('brasa',5),true);
  assert.equal(a.ready('nimbo',5),false);
});
test('Neblina assusta com corrida mas aceita aproximação lenta usando Shift',()=>{
  const a=new WildApproach();
  assert.equal(step(a,'nimbo',.25,{speed:9}).mood,'assustado');
  for(let t=.5;t<2;t+=.25)step(a,'nimbo',t,{speed:0});
  assert.equal(a.ready('nimbo',5),false);
  for(let t=2;t<5;t+=.25)step(a,'nimbo',t,{speed:3.1});
  assert.equal(a.ready('nimbo',5),true);
});
test('distância e montaria impedem domesticar mesmo com calma acumulada',()=>{
  const a=new WildApproach();
  for(let t=.25;t<3;t+=.25)step(a,'raio',t);
  assert.equal(a.ready('raio',6),true);
  assert.equal(a.ready('raio',10),false);
  step(a,'raio',3,{riding:true});
  assert.equal(a.ready('raio',6),false);
});
test('carinho reduz calma para exigir novo contato sem zerar a amizade salva',()=>{
  const a=new WildApproach();
  for(let t=.25;t<3;t+=.25)step(a,'brasa',t);
  assert.equal(a.ready('brasa',5),true);
  a.onBond('brasa');
  assert.equal(a.ready('brasa',5),false);
});
test('pouso assistido só desce em voo lento próximo do terreno e sem comando vertical',()=>{
  assert.equal(landingDescent({airborne:true,speed:3,height:8,up:false,down:false}),-5);
  assert.equal(landingDescent({airborne:true,speed:22,height:8,up:false,down:false}),0);
  assert.equal(landingDescent({airborne:true,speed:3,height:24,up:false,down:false}),0);
  assert.equal(landingDescent({airborne:true,speed:3,height:8,up:true,down:false}),22);
  assert.equal(landingDescent({airborne:true,speed:3,height:8,up:false,down:true}),-20);
});
test('curvas usam suavização independente de FPS e sem ultrapassar entrada',()=>{
  const a=smoothedTurn(0,1,1/60),b=smoothedTurn(0,1,1/30);
  assert.ok(a>0&&a<1);
  assert.ok(b>a&&b<1);
  assert.ok(Math.abs(smoothedTurn(a,1,1/60)-b)<1e-10);
  assert.ok(smoothedTurn(1,-1,.15)<1);
});
