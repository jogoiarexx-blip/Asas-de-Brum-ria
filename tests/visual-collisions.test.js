import test from 'node:test';
import assert from 'node:assert/strict';
import {moveWithCollisions,obstacleBlocks,overlapsCircle,obstacleCeiling} from '../src/utils/collision.js';
import {flightPhase,liftBlend,FLIGHT_PHASES} from '../src/entities/flightMath.js';
import {readFileSync} from 'node:fs';
const obstacle={x:5,z:0,radius:1,bottom:2,top:8,type:'tree'};
const scenery=[obstacle];

test('volume horizontal soma raio da entidade e do obstáculo',()=>{
  assert.equal(overlapsCircle(3.1,0,1,obstacle),true);
  assert.equal(overlapsCircle(3,0,1,obstacle),false);
  assert.equal(overlapsCircle(3.5,2.5,1,obstacle),false);
});
test('arvore deixa de bloquear quando dragão voa acima do topo',()=>{
  assert.equal(obstacleBlocks(obstacle,5,1.5),true);
  assert.equal(obstacleBlocks(obstacle,12,1.5),false);
  assert.equal(obstacleBlocks(obstacle,0,.3),false);
});
test('movimento longo não atravessa casa ou árvore em um único frame',()=>{
  const result=moveWithCollisions({x:0,z:0},{x:20,z:0},1,scenery);
  assert.ok(result.x<3.01,`avançou excessivamente: ${result.x}`);
  assert.equal(result.blocked,true);
});
test('colisão diagonal permite deslizar sem atravessar obstáculos',()=>{
  const result=moveWithCollisions({x:2.8,z:-2.5},{x:5,z:5},1,scenery);
  assert.ok(result.z>-2.5);
  assert.equal(overlapsCircle(result.x,result.z,1,obstacle),false);
});
test('jogador respeita a margem de costa mesmo sem obstáculo',()=>{
  const result=moveWithCollisions({x:0,z:0},{x:10,z:0},.5,[],(x,z)=>x<=4);
  assert.ok(result.x<=4);
  assert.ok(result.x>=3.5);
});
test('save anterior dentro de obstáculo permite escapar, mas não aprofundar',()=>{
  const escape=moveWithCollisions({x:5,z:0},{x:-5,z:0},.5,scenery);
  assert.ok(escape.x<5);
  const blocked=moveWithCollisions({x:4.8,z:0},{x:.2,z:0},.5,scenery);
  assert.equal(blocked.x,4.8);
});
test('cobertura vertical escolhe o obstáculo mais alto sob as asas',()=>{
  assert.equal(obstacleCeiling(5,0,.2,[obstacle,{...obstacle,top:12}]),12);
  assert.equal(obstacleCeiling(30,0,.2,scenery),-Infinity);
});
test('fases do voo são determinísticas entre decolagem, cruzeiro e pouso',()=>{
  assert.deepEqual(FLIGHT_PHASES,['ground','takeoff','cruise','landing']);
  assert.equal(flightPhase(false,0,0,false,0),'ground');
  assert.equal(flightPhase(true,.3,2,false,0),'takeoff');
  assert.equal(flightPhase(true,1.2,20,false,0),'cruise');
  assert.equal(flightPhase(true,1.2,2,true,0),'landing');
  assert.equal(flightPhase(false,0,0,false,.4),'landing');
});
test('abertura progressiva das asas fica entre zero e um',()=>{
  assert.equal(liftBlend(true,0,0),0);
  assert.equal(liftBlend(true,.48,0),1);
  assert.equal(liftBlend(true,60,0),1);
  assert.equal(liftBlend(false,0,0),0);
  assert.ok(liftBlend(false,0,.2)<.5);
});
test('mundo registra obstáculos sólidos, vegetação instanciada e espuma sem download de assets',()=>{
  const world=readFileSync(new URL('../src/world/World.js',import.meta.url),'utf8');
  assert.match(world,/this\.addObstacle\(x,y,z,[^\n]*'tree'\)/);
  assert.match(world,/this\.addObstacle\(x,y,z,[^\n]*'cabin'\)/);
  assert.match(world,/this\.addObstacle\(x,y,z,[^\n]*'rock'\)/);
  assert.match(world,/THREE\.InstancedMesh/);
  assert.match(world,/buildCoastalDetails\(/);
});
test('dragão usa textura procedural com UVs, juntas das asas e animação da mandíbula',()=>{
  const code=readFileSync(new URL('../src/entities/Dragon.js',import.meta.url),'utf8');
  assert.match(code,/CanvasTexture/);
  assert.match(code,/tip\.rotation\.z=/);
  assert.match(code,/jawPivot\.rotation\.x=/);
  assert.match(code,/new THREE\.Float32BufferAttribute\(uvs,2\)/);
});
