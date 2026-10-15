import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {flattenVillageGround,surfaceHeightAt} from '../src/utils/surfaces.js';
import {ISLANDS} from '../src/world/config.js';

const refuge=ISLANDS.find(i=>i.name==='Ilha do Refúgio');
function rawHeight(island,x,z){
  const dx=x-island.x,dz=z-island.z,d=Math.hypot(dx,dz)/island.r;
  if(d>=1)return -2;
  const rough=Math.sin(x*.13+island.seed)*Math.cos(z*.16-island.seed)*.85;
  const wave=Math.sin(x*.055+island.seed)*Math.cos(z*.07)*1.4;
  return -1.5+island.h*Math.pow(Math.max(0,1-d*d),1.7)+(rough+wave)*(1-d);
}
const deckX=8,deckZ=7,center=rawHeight(refuge,8,7),deckTop=center+.545;

test('o terreno sob TODA a plataforma é nivelado com a base do palco',()=>{
 for(let x=1;x<=15;x+=.35)for(let z=0;z<=14;z+=.35){
   if(Math.hypot(x-deckX,z-deckZ)>7.2)continue;
   const actual=flattenVillageGround(rawHeight(refuge,x,z),x,z,center);
   assert.ok(Math.abs(actual-center)<.001,`terreno tem desnível em ${x},${z}: ${actual-center}`);
   assert.ok(deckTop-actual>.5);
 }
});

test('terreno depois da plataforma converge suavemente de volta ao relevo original',()=>{
 const terrain=x=>flattenVillageGround(rawHeight(refuge,x,7),x,7,center);
 assert.equal(terrain(8+18),rawHeight(refuge,8+18,7));
 assert.ok(Math.abs(terrain(8+8.95)-terrain(8+9.05))<.04);
 assert.ok(Math.abs(terrain(8+16.95)-terrain(8+17.05))<.04);
});

test('pés/corpo ainda recebem apoio enquanto parte da cápsula toca o tampo',()=>{
 const surfaces=[{x:8,z:7,radius:7.2,top:deckTop}];
 assert.equal(surfaceHeightAt(center,15.32,7,surfaces,0),center);
 assert.equal(surfaceHeightAt(center,15.32,7,surfaces,.52),deckTop);
 assert.equal(surfaceHeightAt(center,15.8,7,surfaces,.52),center);
});

test('piso limita a área horizontal da plataforma, não toda a ilha',()=>{
 const surfaces=[{x:8,z:7,radius:7.2,top:deckTop}];
 assert.equal(surfaceHeightAt(center,0,7,surfaces,.52),center);
 assert.equal(surfaceHeightAt(center,7,7,surfaces,.52),deckTop);
});

test('malha do mundo e altura de colisão consultam o mesmo terreno nivelado',()=>{
 const world=readFileSync(new URL('../src/world/World.js',import.meta.url),'utf8');
 assert.match(world,/flattenVillageGround\(/);
 assert.match(world,/CylinderGeometry\(7\.2,7\.2,/);
 assert.match(world,/groundHeightAt\(x,z,radius=0\)/);
 const hero=readFileSync(new URL('../src/entities/Hero.js',import.meta.url),'utf8');
 assert.match(hero,/groundHeightAt\(this\.group\.position\.x,this\.group\.position\.z,\.52\)/);
 const dragon=readFileSync(new URL('../src/entities/Dragon.js',import.meta.url),'utf8');
 assert.match(dragon,/groundHeightAt\(this\.group\.position\.x,this\.group\.position\.z,1\.65\)/);
});
