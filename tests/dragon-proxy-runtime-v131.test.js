import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

function threeStub(){
 class Group{constructor(){this.children=[];this.name='';this.visible=true;}add(...items){this.children.push(...items);return this;}}
 class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.position={set:(x,y,z)=>{this.xyz=[x,y,z];}};this.scale={set:(x,y,z)=>{this.stretch=[x,y,z];}};this.rotation={x:0};this.castShadow=null;this.receiveShadow=null;}}
 class Geometry{constructor(...args){this.args=args;}}
 class BufferGeometry{setAttribute(name,value){this.attribute=value;}computeVertexNormals(){}}
 class Float32BufferAttribute{constructor(array,size){this.array=array;this.size=size;}}
 class MeshLambertMaterial{constructor(options){this.options=options;}}
 return {Group,Mesh,Geometry,SphereGeometry:Geometry,ConeGeometry:Geometry,BufferGeometry,Float32BufferAttribute,MeshLambertMaterial,DoubleSide:2};
}
const source=readFileSync(new URL('../src/entities/DragonProxy.js',import.meta.url),'utf8');
const script=source.replace("import * as THREE from 'three';",'const THREE=globalThis.__stubThree;');
const original=globalThis.__stubThree;
globalThis.__stubThree=threeStub();
const {buildDragonProxy}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(script));
globalThis.__stubThree=original;

test('proxy realmente tem cinco malhas, sem filhos articulados nem luzes',()=>{
 const p=buildDragonProxy(0x443322,0xeeaacc);
 assert.equal(p.children.length,5);
 assert.equal(p.name,'DragonProxy_LOD');
 assert.ok(p.children.every(m=>m.castShadow===false&&m.receiveShadow===false));
});
test('proxys de mesma espécie compartilham geometria e materiais GPU',()=>{
 const a=buildDragonProxy(0x443322,0xeeaacc),b=buildDragonProxy(0x443322,0xeeaacc);
 for(let i=0;i<a.children.length;i++){
  assert.equal(a.children[i].geometry,b.children[i].geometry);
  assert.equal(a.children[i].material,b.children[i].material);
 }
});
test('cores de espécies diferentes são independentes, mantendo geometria compartilhada',()=>{
 const a=buildDragonProxy(0x443322,0xeeaacc),b=buildDragonProxy(0x554433,0xaabbcc);
 assert.notEqual(a.children[0].material,b.children[0].material);
 assert.equal(a.children[0].geometry,b.children[0].geometry);
});
test('proxy da sentinela tem silhueta na altura de voo sem deslocar o corpo original',()=>{
 const proxy=buildDragonProxy(0x443322,0xeeaacc,{enemy:true});
 const wild=buildDragonProxy(0x443322,0xeeaacc,{enemy:false});
 assert.equal(proxy.children[0].xyz[1],0);
 assert.equal(wild.children[0].xyz[1],1.9);
});
