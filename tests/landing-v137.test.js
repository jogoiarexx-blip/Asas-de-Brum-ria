import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectLanding,flightCollisionResponse} from '../src/entities/LandingPhysics.js';
import {moveFlightWithCollisions} from '../src/utils/spatialSweep.js';
const flat=()=>10;
const land=(extra={})=>inspectLanding({x:0,z:0,radius:1.15,speed:3,verticalSpeed:-3,groundAt:flat,walkable:()=>true,...extra});
test('pouso seguro em chão plano e velocidade controlada',()=>{
 const r=land();assert.equal(r.safe,true);assert.equal(r.reason,'ok');assert.equal(r.ground,10);
});
test('mar aberto e borda sem superfície nunca permitem pouso',()=>{
 assert.equal(land({groundAt:()=>-2,walkable:()=>false}).safe,false);
 assert.equal(land({walkable:(x,z)=>x<.8}).safe,false);
});
test('declive pronunciado impede pouso até encontrar área plana',()=>{
 assert.equal(land({groundAt:(x,z)=>10+x*2.4}).safe,false);
 assert.equal(land({groundAt:(x,z)=>10+x*.18}).safe,true);
});
test('velocidade horizontal ou vertical excessiva impede pouso',()=>{
 assert.equal(land({speed:18}).safe,false);
 assert.equal(land({verticalSpeed:-17}).safe,false);
 assert.equal(land({verticalSpeed:-7.2,speed:6}).safe,true);
});
test('geometria suspensa no espaço de pouso invalida aterrissagem',()=>{
 assert.equal(land({clearanceAt:()=>20}).safe,false);
 assert.equal(land({clearanceAt:()=>-Infinity}).safe,true);
});
test('alturas inválidas nunca liberam pouso',()=>{
 assert.equal(land({groundAt:()=>NaN}).safe,false);
 assert.equal(land({groundAt:()=>Infinity}).safe,false);
});
test('impacto lateral freia e gera reação, sem gerar dano automático',()=>{
 const r=flightCollisionResponse({speed:45,blockedHorizontal:true,blockedVertical:false,verticalSpeed:0});
 assert.ok(r.speed<12);assert.ok(r.intensity>0);assert.equal(r.collided,true);
 const normal=flightCollisionResponse({speed:45,blockedHorizontal:false,blockedVertical:false});
 assert.equal(normal.collided,false);assert.equal(normal.intensity,0);
});
test('esquiva permanece bloqueada por obstáculos mesmo em alta velocidade',()=>{
 const wall={x:3,z:0,radius:2,shape:'box',halfWidth:1,halfDepth:7,bottom:0,top:17};
 const r=moveFlightWithCollisions({x:-20,y:9,z:0},{x:60,y:0,z:0},1.15,1.65,[wall],()=>-2);
 assert.equal(r.blockedHorizontal,true);assert.ok(r.x<1,'passou pela parede: '+r.x);
});
test('integração: terreno e velocidade são validados antes de descer da montaria',()=>{
 const source=readFileSync(new URL('../src/entities/Dragon.js',import.meta.url),'utf8');
 assert.match(source,/inspectLanding\(/);assert.match(source,/landing\.safe/);
 assert.match(source,/flightCollisionResponse\(/);assert.match(source,/impactPulse/);
});
test('ao encostar no chão, a validação considera a velocidade vertical anterior à colisão',()=>{
 const source=readFileSync(new URL('../src/entities/Dragon.js',import.meta.url),'utf8');
 assert.match(source,/const attemptedVertical=this\.verticalVelocity/);
 assert.match(source,/verticalSpeed:attemptedVertical/);
 assert.ok(inspectLanding({x:0,z:0,groundAt:()=>0,walkable:()=>true,verticalSpeed:-18}).safe===false);
});
test('colisão vertical forte causa impacto mas não exige dano ou alocações gráficas',()=>{
 const r=flightCollisionResponse({speed:5,blockedVertical:true,verticalSpeed:-25});
 assert.ok(r.intensity>.8);assert.equal(r.collided,true);assert.equal(r.speed,5);
});
test('a superfície de uma ponte alta também pode ser usada para pouso',()=>{
 const result=land({groundAt:()=>43});assert.equal(result.safe,true);assert.equal(result.ground,43);
});
