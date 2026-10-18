import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {QUEST_DEFS,RING_POSITIONS,CRYSTAL_POSITIONS,TARGET_POSITIONS,HATCHLING_POSITIONS} from '../src/world/config.js';
import {rescueApproach,deliveryReady,RESCUE_HOVER_SECONDS,RESCUE_NEST} from '../src/systems/RescueRules.js';

// Run the actual Missions class with a minimal Three.js scene adapter, not a
// reimplementation of its logic: catches pickup/drop-off/save regressions.
class Vec3 {
 constructor(x=0,y=0,z=0){this.set(x,y,z);}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
 distanceTo(other){return Math.sqrt(this.distanceToSquared(other));}
 distanceToSquared(o){return (this.x-o.x)**2+(this.y-o.y)**2+(this.z-o.z)**2;}
}
class Group{
 constructor(){this.position=new Vec3();this.rotation={x:0,y:0,z:0};this.userData={};this.children=[];this.scale={setScalar(){},set(){}};this.visible=true;}
 add(mesh){this.children.push(mesh);}
}
class Mesh extends Group{constructor(){super();}}
const Three={Group,Mesh,DoubleSide:2,
 MeshBasicMaterial:class{},MeshStandardMaterial:class{},MeshLambertMaterial:class{},
 TorusGeometry:class{},CylinderGeometry:class{},OctahedronGeometry:class{},IcosahedronGeometry:class{},
 SphereGeometry:class{},ConeGeometry:class{},TetrahedronGeometry:class{}
};
function createMissions(){
 const js=readFileSync(new URL('../src/systems/Missions.js',import.meta.url),'utf8')
   .replace(/^import[^\n]*\n/gm,'').replace('export class Missions','class Missions')+'\nglobalThis.Result=Missions;';
 const ctx={THREE:Three,QUEST_DEFS,RING_POSITIONS,CRYSTAL_POSITIONS,TARGET_POSITIONS,HATCHLING_POSITIONS,
   rescueApproach,deliveryReady,RESCUE_HOVER_SECONDS,RESCUE_NEST};
 runInNewContext(js,ctx);
 const awards=[],sounds=[],messages=[],snapshots=[];
 const mission=new ctx.Result({add(){}},{play:x=>sounds.push(x)},()=>{},null,stage=>awards.push(stage));
 mission.stage=5;mission.refreshVisible();mission.onCheckpoint=()=>snapshots.push(mission.snapshot());
 return {mission,awards,sounds,messages,snapshots,toast:text=>messages.push(text)};
}
const moveTo=(dragon,point)=>dragon.group.position.set(point.x,point.y,point.z);
const dragon=()=>({riding:true,speed:6,group:{position:new Vec3()}});
test('filhote não é recolhido se o dragão passar rapidamente e não transporta sozinho',()=>{
 const {mission,toast}=createMissions(),mount=dragon();
 const baby=mission.hatchlings[0].position;moveTo(mount,baby);mount.speed=38;
 for(let i=0;i<60;i++)mission.update(.05,i*.05,mount,toast);
 assert.equal(mission.carriedIndex,-1);assert.equal(mission.progress,0);
 mount.speed=6;
 for(let i=0;i<26;i++)mission.update(.05,3+i*.05,mount,toast);
 assert.equal(mission.carriedIndex,0);assert.equal(mission.progress,0);
});
test('resgate completo exige três recolhas e três entregas, sem conceder prêmios extras',()=>{
 const {mission,toast,awards,snapshots}=createMissions(),mount=dragon();
 for(let i=0;i<3;i++){
  moveTo(mount,mission.hatchlings[i].position);
  for(let tick=0;tick<26;tick++)mission.update(.05,i*5+tick*.05,mount,toast);
  assert.equal(mission.carriedIndex,i);
  assert.equal(mission.progress,i);
  moveTo(mount,mission.nest.position);mission.update(.05,i*5+2,mount,toast);
  if(i<2)assert.equal(mission.progress,i+1);
 }
 assert.equal(mission.stage,6);assert.equal(mission.progress,0);
 assert.deepEqual(awards,[5]);
 assert.equal(mission.hatchlings.every(g=>g.userData.rescued),true);
 assert.equal(snapshots.length,6);
});
test('salvamento mantém o filhote já recolhido e permite terminar entrega após carregar',()=>{
 const old=createMissions(),mount=dragon();moveTo(mount,old.mission.hatchlings[0].position);
 for(let i=0;i<26;i++)old.mission.update(.05,i*.05,mount,old.toast);
 const saved=old.mission.snapshot();assert.equal(saved.carriedIndex,0);
 const loaded=createMissions();loaded.mission.restore(saved);
 assert.equal(loaded.mission.carriedIndex,0);
 moveTo(mount,loaded.mission.nest.position);
 loaded.mission.update(.05,2,mount,loaded.toast);
 assert.equal(loaded.mission.progress,1);
 assert.equal(loaded.mission.hatchlings[0].userData.rescued,true);
});
