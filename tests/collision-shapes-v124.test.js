import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {overlapsCircle,obstacleBlocks,obstacleCeiling,landmarkCollisionVolumes,moveWithCollisions,recoverFreePosition} from '../src/utils/collision.js';
import {resolveCameraPosition,moveFlightWithCollisions} from '../src/utils/spatialSweep.js';

const crate={x:0,z:0,radius:Math.SQRT2,shape:'box',halfWidth:1,halfDepth:1,bottom:0,top:1.5};
const house={x:0,z:0,radius:Math.hypot(3,2.5),shape:'box',halfWidth:3,halfDepth:2.5,bottom:0,top:5};
const polygon={x:0,z:0,radius:4.3,shape:'polygon',sides:7,bottom:0,top:1.5};

test('caixa retangular libera os cantos fora da geometria visual sem permitir penetração na quina',()=>{
 assert.equal(overlapsCircle(1.3,1.3,.15,crate),false);
 assert.equal(overlapsCircle(1.02,1.02,.2,crate),true);
 assert.equal(overlapsCircle(1.5,0,.1,crate),false);
});
test('caixa rotacionada usa ângulo do objeto visual',()=>{
 const rotated={...crate,angle:Math.PI/4};
 assert.equal(overlapsCircle(1.2,0,.05,rotated),true);
 assert.equal(overlapsCircle(1.1,1.1,.05,rotated),false);
});
test('cabana mantém parede reta, bloqueia face e permite passagem livre no canto',()=>{
 assert.equal(overlapsCircle(3.5,0,.52,house),true);
 assert.equal(overlapsCircle(3.65,3.35,.52,house),false);
 const stopped=moveWithCollisions({x:-7,z:0},{x:15,z:0},.52,[house]);
 assert.ok(stopped.x< -3.45 && stopped.x> -4.4,`wall x=${stopped.x}`);
});
test('movimento tangencial desliza sobre parede retangular',()=>{
 const result=moveWithCollisions({x:-3.7,z:-4},{x:0,z:10},.52,[house]);
 assert.ok(result.z>5.5);
 assert.equal(result.blocked,false);
});
test('a base poligonal do monumento não bloqueia espaço livre entre as quinas',()=>{
 const [base,pillar]=landmarkCollisionVolumes(0,0,0);
 assert.equal(base.shape,'polygon');assert.equal(base.sides,7);
 assert.equal(pillar.shape,'polygon');assert.equal(pillar.sides,5);
 const theta=Math.PI/7;
 const vertexR=4.3;
 // Halfway between two vertices: inside circumscribed circle, outside polygon.
 const edge=vertexR*Math.cos(Math.PI/7);
 assert.equal(overlapsCircle(Math.sin(theta)*(edge+.18),Math.cos(theta)*(edge+.18),.05,base),false);
 assert.equal(overlapsCircle(0,0,.52,base),true);
});
test('vôo e câmera respeitam caixa com afastamento preciso sem colisão fantasma no canto',()=>{
 const outside=resolveCameraPosition({x:-8,y:2,z:3.8},{x:8,y:2,z:3.8},[house],()=>-10,{radius:.35});
 assert.equal(outside.clipped,false);
 const wall=resolveCameraPosition({x:-8,y:2,z:0},{x:8,y:2,z:0},[house],()=>-10,{radius:.35});
 assert.equal(wall.clipped,true);
 const clear=moveFlightWithCollisions({x:-8,y:3,z:3.8},{x:16,y:0,z:0},.35,.5,[house],()=>-20);
 assert.equal(clear.blockedHorizontal,false);
 const blocked=moveFlightWithCollisions({x:-8,y:3,z:0},{x:16,y:0,z:0},.35,.5,[house],()=>-20);
 assert.equal(blocked.blockedHorizontal,true);
});
test('câmera verifica volumes poligonais com altura e não o círculo invisível',()=>{
 const [base]=landmarkCollisionVolumes(0,0,0);
 const y=.75, z=4.2;
 const p=resolveCameraPosition({x:-8,y,z},{x:8,y,z},[base],()=>-10,{radius:.05});
 assert.equal(p.clipped,false);
});
test('salvamentos e desmontagem usam a forma real do obstáculo',()=>{
 const p=recoverFreePosition({x:3.35,z:2.7},.2,[house]);
 assert.equal(p.recovered,false);
 const q=recoverFreePosition({x:0,z:0},.52,[house]);
 assert.equal(q.recovered,true);
 assert.equal(overlapsCircle(q.x,q.z,.6,house),false);
 assert.equal(obstacleCeiling(3.6,3.2,.1,[house]),-Infinity);
});
test('o mundo registra geometria de colisão compatível com cabanas e caixas',()=>{
 const world=readFileSync(new URL('../src/world/World.js',import.meta.url),'utf8');
 assert.match(world,/shape:\s*'box'/);
 assert.match(world,/halfWidth:/);
 assert.match(world,/halfDepth:/);
 assert.match(world,/angle:/);
});

test('telhado suspenso não bloqueia personagem andando pelo chão',()=>{
 const roof={x:0,z:0,radius:5.3,bottom:3.8,top:7.4,shape:'polygon',sides:4,phase:Math.PI/4,radiusTop:.1};
 const mover=moveWithCollisions({x:-8,z:3.3},{x:16,z:0},.52,[roof],()=>true,o=>obstacleBlocks(o,1.1,1.1));
 assert.ok(mover.x>7.8);
 const aerial=moveFlightWithCollisions({x:-8,y:5,z:0},{x:16,y:0,z:0},.52,.5,[roof],()=>-100);
 assert.equal(aerial.blockedHorizontal,true);
});
test('casas preservam raio amplo para broad-phase no canto',()=>{
 const source=readFileSync(new URL('../src/world/World.js',import.meta.url),'utf8');
 assert.match(source,/Math\.hypot\(3\*size,2\.5\*size\)/);
});
test('coluna afunila: voo junto do topo respeita menor seção',async()=>{
 const {overlapsObstacle3D}=await import('../src/utils/collision.js');
 const pillar=landmarkCollisionVolumes(0,0,0)[1];
 assert.equal(overlapsObstacle3D(1.8,8.8,0,.2,.1,pillar),false);
 assert.equal(overlapsObstacle3D(1.8,2,0,.2,.1,pillar),true);
});
test('registro dos monumentos conserva metadados de forma no mundo',()=>{
 const scene=readFileSync(new URL('../src/world/Landmarks.js',import.meta.url),'utf8');
 assert.match(scene,/Object\.assign\(world\.obstacles\.at\(-1\),collider\)/);
});
