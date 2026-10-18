import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {ExpeditionProgress,normalizeExpedition,MOUNTAIN_ENTRY} from '../src/systems/ExpeditionRules.js';
import {readGPUSettings,writeGPUSettings,chooseContextOptions} from '../src/systems/GPUSettings.js';

function stubThree(){
  let disposed=0;
  class Obj{constructor(){this.children=[];this.userData={};this.position={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}};this.rotation={};this.scale={set(){}};this.parent=null;}
    add(object){object.parent=this;this.children.push(object);}
    remove(object){this.children=this.children.filter(x=>x!==object);object.parent=null;}
    traverse(fn){fn(this);for(const child of this.children)child.traverse(fn);}}
  class Geometry{setAttribute(){}setIndex(){}computeVertexNormals(){}dispose(){disposed++;}}
  class Mesh extends Obj{constructor(geometry,material){super();this.geometry=geometry;this.material=material;}}
  class Material{constructor(options){Object.assign(this,options);}dispose(){disposed++;}}
  class Attribute{constructor(buffer,count){this.buffer=buffer;this.count=count;}}
  class Color{constructor(hex){this.r=((hex>>16)&255)/255;this.g=((hex>>8)&255)/255;this.b=(hex&255)/255;}}
  return {THREE:{Group:Obj,Mesh,BufferGeometry:Geometry,Float32BufferAttribute:Attribute,Color,
    MeshLambertMaterial:Material,MeshStandardMaterial:Material,MeshBasicMaterial:Material,
    ConeGeometry:Geometry,CylinderGeometry:Geometry,BoxGeometry:Geometry,IcosahedronGeometry:Geometry,
    SphereGeometry:Geometry,PlaneGeometry:Geometry,TorusGeometry:Geometry,DoubleSide:2},get disposed(){return disposed;}};
}
async function moduleWithThree(stub){
 const url=new URL('../src/world/MountainRegion.js',import.meta.url);
 const rules=new URL('../src/systems/ExpeditionRules.js',import.meta.url).href;
 let code=readFileSync(url,'utf8').replace("import * as THREE from 'three';",'const THREE=globalThis.__brumariaMockThree;');
 code=code.replace("from '../systems/ExpeditionRules.js'",`from '${rules}'`);
 globalThis.__brumariaMockThree=stub;
 try{return await import('data:text/javascript,'+encodeURIComponent(code));}finally{delete globalThis.__brumariaMockThree;}
}
test('mapa das montanhas é construído sob demanda, com barcos e chefe, e pode ser descarregado',async()=>{
 const mock=stubThree(),{MountainRegion}=await moduleWithThree(mock.THREE);
 const scene=new mock.THREE.Group(),world={obstacles:[{type:'home'}],mountainRegion:null};
 const expedition=new ExpeditionProgress();
 const level=new MountainRegion(scene,world,expedition);world.mountainRegion=level;
 assert.equal(scene.children.length,1);assert.equal(level.boats.length,3);
 assert.equal(level.boss.visible,false);assert.equal(level.boats.filter(b=>b.visible).length,3);
 assert.ok(world.obstacles.length>1);assert.ok(level.heightAt(1042,3)>-2);
 assert.equal(level.heightAt(800,3),-2);
 assert.ok(level.root.name.includes('MONTANHAS'));
 level.update(.016,3);level.unload();
 assert.equal(scene.children.length,0);assert.equal(world.obstacles.length,1);
 assert.equal(world.mountainRegion,null);
 assert.ok(mock.disposed>0);
});
test('os barcos somem conforme são destruídos e chefe surge na segunda fase',async()=>{
 const mock=stubThree(),{MountainRegion}=await moduleWithThree(mock.THREE),scene=new mock.THREE.Group();
 const progress=new ExpeditionProgress(),level=new MountainRegion(scene,{obstacles:[],mountainRegion:null},progress);
 for(let i=0;i<3;i++){progress.hitBoat(i);progress.hitBoat(i);level.refresh();assert.equal(level.boats[i].visible,false);}
 assert.equal(progress.phase,'boss');assert.equal(level.boss.visible,true);
 for(let i=0;i<12;i++)progress.hitBoss();
 level.refresh();assert.equal(level.boss.visible,false);assert.equal(progress.phase,'return');
});
test('progresso da campanha independe do local e não se repete ao entregar a recompensa',()=>{
 const progress=new ExpeditionProgress({boatHealth:[0,0,0],bossHealth:0});
 progress.inRegion=true;
 const saved=JSON.parse(JSON.stringify(progress.snapshot()));
 const reopened=new ExpeditionProgress(saved);
 assert.equal(reopened.phase,'return');assert.equal(reopened.inRegion,true);
 assert.equal(reopened.completeReturn(),true);
 assert.equal(reopened.completeReturn(),false);
 assert.equal(new ExpeditionProgress(reopened.snapshot()).phase,'complete');
});
test('GPU permite salvar as preferências e recuperar o valor após recarregar',()=>{
 const values=new Map();const storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)};
 const saved={preference:'high-performance',resolution:.5,shadows:false,antialias:false};
 assert.equal(writeGPUSettings(saved,storage),true);
 assert.deepEqual(readGPUSettings(storage),saved);
 assert.deepEqual(chooseContextOptions(saved),{powerPreference:'high-performance',antialias:false});
});
test('interfaces exibem seletor GPU e direções de expedição',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const id of ['gpu-panel','gpu-toggle','gpu-preference','gpu-resolution','gpu-shadows','gpu-antialias','mountain-status'])assert.ok(html.includes(`id="${id}"`),id);
 const game=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 assert.match(game,/this\.updateExpedition\(dt\)/);assert.match(game,/this\.mountain\.unload\(\)/);
 assert.match(game,/MOUNTAIN_ENTRY/);
});
test('barcos destruídos deixam de bloquear a área e mapa recarregado não duplica colisores',async()=>{
 const mock=stubThree(),{MountainRegion}=await moduleWithThree(mock.THREE);
 const root=new mock.THREE.Group();const world={obstacles:[],mountainRegion:null},progress=new ExpeditionProgress();
 let region=new MountainRegion(root,world,progress);world.mountainRegion=region;
 const old=world.obstacles.length;
 assert.ok(old>3);
 progress.hitBoat(0);progress.hitBoat(0);region.refresh();
 assert.equal(region.boatObstacles[0].bottom,region.boatObstacles[0].top);
 region.unload();assert.equal(world.obstacles.length,0);
 region=new MountainRegion(root,world,progress);world.mountainRegion=region;
 assert.equal(world.obstacles.length,old);assert.equal(region.boats[0].visible,false);
 region.unload();assert.equal(world.obstacles.length,0);
});
test('aproximação a pé não busca o módulo completo das montanhas',async()=>{
 const {shouldLoadMountain,shouldEnterMountain,MOUNTAIN_PORTAL}=await import('../src/systems/ExpeditionRules.js');
 assert.equal(shouldLoadMountain({x:329,y:3,z:MOUNTAIN_PORTAL.z},true),false);
 assert.equal(shouldLoadMountain({x:329,y:53,z:MOUNTAIN_PORTAL.z},false),false);
 assert.equal(shouldEnterMountain({x:370,y:20,z:300},true),false);
});
test('progresso de campanha permanece opcional para saves antigos',async()=>{
 const {normalizeSave}=await import('../src/systems/SaveSystem.js');
 const sample={version:1,mission:{stage:3},progression:{species:'nimbo'},player:{x:10,y:10,z:10}};
 const old=normalizeSave(sample);assert.equal(old.expedition.phase,'boats');
 const newer=normalizeSave({...sample,expedition:{boatHealth:[0,0,0],bossHealth:3,phase:'boss',inRegion:true},player:{x:1120,y:80,z:0,mounted:true}});
 assert.equal(newer.expedition.phase,'boss');assert.equal(newer.player.x,1120);
});
