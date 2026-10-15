import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveCameraPosition,moveFlightWithCollisions} from '../src/utils/spatialSweep.js';
const rock={x:0,z:0,radius:3,bottom:0,top:9,type:'landmark-pillar'};
const flat=()=>-5;
const near=(a,b,eps=.15)=>Math.abs(a-b)<eps;

test('câmera para antes da torre entre o jogador e o ponto desejado',()=>{
 const p=resolveCameraPosition({x:-10,y:5,z:0},{x:10,y:5,z:0},[rock],flat,{radius:.45});
 assert.ok(p.x<-3.4 && p.x>-5);
 assert.equal(p.clipped,true);
});
test('câmera não reage a torre acima ou abaixo da linha de visão',()=>{
 const p=resolveCameraPosition({x:-10,y:15,z:0},{x:10,y:15,z:0},[rock],flat,{radius:.45});
 assert.ok(near(p.x,10));
 assert.equal(p.clipped,false);
});
test('câmera respeita solo intermediário mesmo quando destino está livre',()=>{
 const hill=x=>Math.abs(x)<1.2?7:-4;
 const p=resolveCameraPosition({x:-9,y:3,z:0},{x:9,y:3,z:0},[],hill,{radius:.4});
 assert.ok(p.x<-1.2);
});
test('câmera segue normalmente quando o corredor está livre',()=>{
 const p=resolveCameraPosition({x:-9,y:5,z:0},{x:7,y:6,z:3},[],flat);
 assert.ok(near(p.x,7)&&near(p.y,6)&&near(p.z,3));
});
test('voo acelerado não atravessa coluna',()=>{
 const p=moveFlightWithCollisions({x:-12,y:6,z:0},{x:25,y:0,z:0},1.15,1.65,[rock],flat);
 assert.ok(p.x<-4.14);
 assert.equal(p.blockedHorizontal,true);
});
test('descida vertical para antes do teto',()=>{
 const p=moveFlightWithCollisions({x:0,y:13,z:0},{x:0,y:-12,z:0},1.15,1.65,[rock],flat);
 assert.ok(p.y>=10.6 && p.y<13);
 assert.equal(p.blockedVertical,true);
});
test('subida não atravessa obstáculo',()=>{
 const roof={x:0,z:0,radius:3,bottom:6,top:9};
 const p=moveFlightWithCollisions({x:0,y:3,z:0},{x:0,y:12,z:0},1.1,1.6,[roof],flat);
 assert.ok(p.y<=4.45);
});
test('voo alto cruza normalmente sobre torre',()=>{
 const p=moveFlightWithCollisions({x:-12,y:17,z:0},{x:25,y:0,z:0},1.15,1.65,[rock],flat);
 assert.ok(near(p.x,13,.2));
 assert.equal(p.blockedHorizontal,false);
});
test('voo evita terreno durante descida diagonal',()=>{
 const steep=x=>x>0?3:0;
 const p=moveFlightWithCollisions({x:-4,y:5,z:0},{x:8,y:-3,z:3},1,1.6,[],steep,{floorOffset:2.58});
 assert.ok(p.y>=steep(p.x)+2.58-.01);
});
test('sistemas são integrados à câmera e ao dragão',()=>{
 const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 const dragon=readFileSync(new URL('../src/entities/Dragon.js',import.meta.url),'utf8');
 assert.ok(game.includes('resolveCameraPosition('));
 assert.ok(dragon.includes('moveFlightWithCollisions('));
});
