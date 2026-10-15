import test from 'node:test';
import assert from 'node:assert/strict';
import {moveWithCollisions, overlapsCircle} from '../src/utils/collision.js';
import {surfaceHeightAt, safeDismountSpot} from '../src/utils/surfaces.js';
import {readFileSync} from 'node:fs';

const terrain=(x,z)=>0;
const platform={x:8,z:7,radius:7.1,top:1.15};

test('plataforma é piso sólido, e não apenas desenho',()=>{
  assert.equal(surfaceHeightAt(0,8,7,[platform]),1.15);
  assert.equal(surfaceHeightAt(0,20,7,[platform]),0);
  assert.equal(surfaceHeightAt(2,8,7,[platform]),2);
  assert.equal(surfaceHeightAt(-2,8,7,[platform]),1.15);
});
test('andar permite subir degraus baixos, mas impede saltar um paredão',()=>{
  const ground=(x)=>x>2?3:0;
  const r=moveWithCollisions({x:0,z:0},{x:6,z:0},.5,[],()=>true,()=>true,{groundAt:ground,maxStepUp:1});
  assert.ok(r.x<=2,`subiu ${r.x} atravessando um desnível de 3 m`);
  assert.equal(r.blocked,true);
});
test('andar sobre piso levemente elevado sem travar',()=>{
  const ground=(x)=>x>=3?0.7:0;
  const r=moveWithCollisions({x:0,z:0},{x:6,z:0},.5,[],()=>true,()=>true,{groundAt:ground,maxStepUp:1});
  assert.ok(r.x>=5.9);
  assert.equal(r.groundY,0.7);
});
test('deslocamento diagonal respeita degrau e mantém deslizamento',()=>{
  const ground=(x,z)=>x>2?5:0;
  const r=moveWithCollisions({x:0,z:0},{x:5,z:4},.5,[],()=>true,()=>true,{groundAt:ground,maxStepUp:1});
  assert.ok(r.x<=2);
  assert.ok(r.z>3.9);
});
test('posicionamento ao desmontar evita caixa e fogueira e encontra ponto livre',()=>{
  const obstacles=[{x:2,z:2,radius:1.5,bottom:0,top:3,type:'crate'},
    {x:-2,z:0,radius:2.1,bottom:0,top:2.7,type:'fire'}];
  const spot=safeDismountSpot({x:0,z:0},{obstacles,walkable:()=>true,groundAt:terrain,radius:.52});
  assert.ok(spot);
  assert.ok(obstacles.every(o=>!overlapsCircle(spot.x,spot.z,.52,o)));
});
test('desmontar não teletransporta jogador de uma borda para o fundo de um precipício',()=>{
  const ground=(x,z)=>Math.abs(x)<1&&Math.abs(z)<1?20:0;
  const spot=safeDismountSpot({x:0,z:0},{obstacles:[],walkable:()=>true,groundAt:ground});
  assert.equal(spot,null);
});
test('desmontar falha de modo seguro quando todo o entorno está bloqueado',()=>{
  const spot=safeDismountSpot({x:0,z:0},{obstacles:[{x:0,z:0,radius:30,bottom:0,top:4}],walkable:()=>true,groundAt:terrain});
  assert.equal(spot,null);
});
test('volumes do vilarejo incluem caixas, postes e fogueira',()=>{
  const src=readFileSync(new URL('../src/world/World.js',import.meta.url),'utf8');
  for(const type of ['crate','post','fire'])assert.match(src,new RegExp(`addObstacle\\([^;]*'${type}'\\)`));
  assert.match(src,/this\.surfaces\.push\(/);
  const villagers=readFileSync(new URL('../src/entities/VillageNPCs.js',import.meta.url),'utf8');
  assert.match(villagers,/addObstacle\([^;]*'npc'\)/);
});
test('posições do personagem, dragão e câmera usam suporte do piso',()=>{
  const root=new URL('../src/',import.meta.url);
  const dragon=readFileSync(new URL('entities/Dragon.js',root),'utf8');
  const hero=readFileSync(new URL('entities/Hero.js',root),'utf8');
  const game=readFileSync(new URL('game/Game.js',root),'utf8');
  assert.match(dragon,/groundHeightAt\(/);
  assert.match(hero,/groundHeightAt\(/);
  assert.match(game,/safeDismountSpot\(/);
  assert.match(game,/groundHeightAt\(/);
});
