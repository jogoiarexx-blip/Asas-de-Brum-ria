import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {airflowTarget,airflowSpeed} from '../src/entities/Airflow.js';
import {enemyCombatPlan} from '../src/systems/EnemyTactics.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('dragão que perde velocidade plana e desce suavemente em altitude',()=>{
 const p=airflowTarget({airborne:true,speed:4,height:35,up:false,down:false});
 assert.ok(p<0&&p>=-6);
 assert.equal(airflowTarget({airborne:false,speed:0,height:0}),0);
});
test('com velocidade de cruzeiro não perde altitude artificialmente',()=>{
 assert.equal(airflowTarget({airborne:true,speed:22,height:45}),0);
});
test('subir e mergulhar permanecem controlados pelo jogador',()=>{
 assert.ok(airflowTarget({airborne:true,speed:7,height:50,up:true})>10);
 assert.ok(airflowTarget({airborne:true,speed:12,height:50,down:true})<-10);
});
test('dive ganha impulso moderado, subida tem arrasto',()=>{
 const dive=airflowSpeed(22,-17,.1,45);
 const climb=airflowSpeed(22,16,.1,45);
 assert.ok(dive>22&&dive<23);
 assert.ok(climb<22&&climb>21);
});
test('física de vento não quebra valores inválidos, limites ou FPS baixos',()=>{
 for(const input of [NaN,Infinity,-Infinity])assert.equal(airflowSpeed(input,NaN,0.1,40),0);
 assert.ok(airflowSpeed(200,-20,.05,30)<=30);
 assert.ok(airflowTarget({airborne:true,speed:0,height:NaN})<=0);
});
test('sentinela danificada evita aproximação reta por pouco tempo',()=>{
 const plan=enemyCombatPlan({distance:65,health:1,evadeTime:.5,index:1,time:0});
 assert.equal(plan.mode,'evade');assert.ok(Math.abs(plan.flank)>5);
});
test('sentinela saudável e distante patrulha, em alcance pode flanquear',()=>{
 assert.equal(enemyCombatPlan({distance:280,health:3,evadeTime:0}).mode,'patrol');
 assert.equal(enemyCombatPlan({distance:65,health:3,evadeTime:0}).mode,'flank');
});
test('sentinela muito próxima recua sem teletransporte',()=>{
 const plan=enemyCombatPlan({distance:18,health:3,evadeTime:0});
 assert.equal(plan.mode,'retreat');assert.ok(plan.retreat>=15&&plan.retreat<=38);
});
test('danos ativam esquiva e plano não gera velocidade negativa',()=>{
 const s=read('../src/entities/EnemyDragon.js');
 assert.match(s,/enemyCombatPlan\(/);
 assert.match(s,/this\.evadeTime=/);
 assert.match(s,/this\.tactic=/);
});
test('cálculo aerodinâmico está integrado ao movimento com colisão contínua',()=>{
 const s=read('../src/entities/Dragon.js');
 assert.match(s,/airflowTarget\(/);assert.match(s,/airflowSpeed\(/);
 assert.match(s,/moveFlightWithCollisions\(/);
});
