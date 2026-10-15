import * as THREE from 'three';
import { QUEST_DEFS,RING_POSITIONS,CRYSTAL_POSITIONS,TARGET_POSITIONS,HATCHLING_POSITIONS } from '../world/config.js';
export class Missions {
  constructor(scene,audio,onProgress,enemies=null,onAward=null) {
    this.scene=scene;this.audio=audio;this.onProgress=onProgress;this.enemies=enemies;this.onAward=onAward;
    this.stage=0;this.progress=0;this.rings=[];this.crystals=[];this.targets=[];this.hatchlings=[];
    this.build();this.refreshVisible();
  }
  get quest() { return QUEST_DEFS[this.stage]??null; }
  get complete() { return this.stage>=QUEST_DEFS.length; }
  build() {
    const ringMat=new THREE.MeshBasicMaterial({color:0x7affdd,side:THREE.DoubleSide});
    const ringAccent=new THREE.MeshBasicMaterial({color:0xe9d782,side:THREE.DoubleSide});
    for(let i=0;i<RING_POSITIONS.length;i++){
      const [x,y,z]=RING_POSITIONS[i];const group=new THREE.Group();group.position.set(x,y,z);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(7.6,.48,10,48),ringMat);group.add(ring);
      const outer=new THREE.Mesh(new THREE.TorusGeometry(8.6,.13,6,48),ringAccent);group.add(outer);
      const inner=new THREE.Mesh(new THREE.TorusGeometry(6.35,.09,5,48),ringAccent);group.add(inner);
      ring.rotation.z=i*.2;outer.rotation.z=i*.3;
      const dot=new THREE.Mesh(new THREE.SphereGeometry(.65,8,6),new THREE.MeshBasicMaterial({color:0xffe4a1}));dot.position.y=9.1;group.add(dot);
      // Face normal roughly along approach direction
      group.rotation.y=-(i*.42);
      this.scene.add(group);this.rings.push(group);
    }
    for(let i=0;i<CRYSTAL_POSITIONS.length;i++){
      const [x,y,z]=CRYSTAL_POSITIONS[i];const group=new THREE.Group();group.position.set(x,y,z);
      const mat=new THREE.MeshStandardMaterial({color:0x8ffff1,emissive:0x1a929a,emissiveIntensity:1.6,metalness:.22,roughness:.15});
      const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(3.2,0),mat);group.add(crystal);
      for(let k=0;k<3;k++){
        const orbit=new THREE.Mesh(new THREE.TorusGeometry(4.8,.12,5,30),new THREE.MeshBasicMaterial({color:0xf0df8a}));
        orbit.rotation.x=(k+1)*.55;orbit.rotation.y=k*.45;group.add(orbit);
      }
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(.26,1.7,48,8,1,true),new THREE.MeshBasicMaterial({color:0x8affdf,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=17;group.add(beam);
      this.scene.add(group);this.crystals.push(group);
    }
    for(let i=0;i<TARGET_POSITIONS.length;i++){
      const [x,y,z]=TARGET_POSITIONS[i];const group=new THREE.Group();group.position.set(x,y,z);
      const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(5,1),new THREE.MeshStandardMaterial({color:0x342947,emissive:0x5b285e,emissiveIntensity:.95,flatShading:true,roughness:.5}));group.add(shell);
      const core=new THREE.Mesh(new THREE.IcosahedronGeometry(2.2,1),new THREE.MeshBasicMaterial({color:0xec6ba0}));group.add(core);
      const orbit=new THREE.Mesh(new THREE.TorusGeometry(7,.42,6,32),new THREE.MeshBasicMaterial({color:0xe66da6,side:THREE.DoubleSide}));orbit.rotation.x=.45;group.add(orbit);
      for(let k=0;k<5;k++){
        const a=k*Math.PI*2/5;const shard=new THREE.Mesh(new THREE.TetrahedronGeometry(1.7),new THREE.MeshLambertMaterial({color:0x77517e}));
        shard.position.set(Math.sin(a)*7,Math.cos(a*2)*2,Math.cos(a)*7);group.add(shard);
      }
      this.scene.add(group);this.targets.push(group);
    }
    // Filhotes originais: asas pequenas animadas e sinal de resgate.
    for(let i=0;i<HATCHLING_POSITIONS.length;i++){
      const [x,y,z]=HATCHLING_POSITIONS[i];const group=new THREE.Group();group.position.set(x,y,z);
      const skin=new THREE.MeshStandardMaterial({color:[0x57ad87,0x779ada,0xc7ab5d][i],flatShading:true,roughness:.6});
      const glow=new THREE.MeshBasicMaterial({color:0xa5ffd0,transparent:true,opacity:.78,side:THREE.DoubleSide});
      const body=new THREE.Mesh(new THREE.SphereGeometry(1.1,10,8),skin);body.scale.set(1,.8,1.55);group.add(body);
      const face=new THREE.Mesh(new THREE.SphereGeometry(.75,10,8),skin);face.position.set(0,.6,-1.25);group.add(face);
      const eye=new THREE.MeshBasicMaterial({color:0xffebc4});
      for(const side of [-1,1]){
        const w=new THREE.Group();w.position.set(side*.95,.35,0);
        const mesh=new THREE.Mesh(new THREE.ConeGeometry(1.2,3,3),skin);mesh.rotation.z=side*Math.PI*.45;w.add(mesh);group.add(w);
        (group.userData.wings??=[]).push({w,side});
        const e=new THREE.Mesh(new THREE.SphereGeometry(.14,6,6),eye);e.position.set(side*.48,.87,-1.73);group.add(e);
      }
      const ring=new THREE.Mesh(new THREE.TorusGeometry(4,.16,5,28),glow);ring.rotation.x=.2;group.add(ring);
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(.2,1.4,22,7,1,true),new THREE.MeshBasicMaterial({color:0x83ffc7,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false}));beam.position.y=11;group.add(beam);
      group.userData.ring=ring;this.scene.add(group);this.hatchlings.push(group);
    }
  }
  refreshVisible() {
    this.rings.forEach((g,i)=>g.visible=this.stage===1 && i===this.progress);
    this.crystals.forEach((g)=>g.visible=this.stage===2 && !g.userData.collected);
    this.targets.forEach((g)=>g.visible=this.stage===3 && !g.userData.destroyed);
    this.hatchlings.forEach((g)=>g.visible=this.stage===5 && !g.userData.rescued);
    this.enemies?.setActive(this.stage===4);
    this.onProgress?.();
  }
  award() {
    const name=this.quest?.title;
    this.stage++;this.progress=0;this.refreshVisible();this.audio.play('complete');this.onAward?.(this.stage-1);
    return name;
  }
  finishBond() { if(this.stage!==0)return false;this.award();return true; }
  trainingCompleted(){if(this.stage!==6)return false;this.award();return true;}
  enemyDefeated(){
    if(this.stage!==4)return false;
    this.progress++;this.audio.play('hit');
    if(this.progress>=3)this.award();else this.refreshVisible();
    return true;
  }
  hitTarget(index) {
    if(this.stage!==3||this.targets[index]?.userData.destroyed)return false;
    const target=this.targets[index];if(!target)return false;
    target.userData.destroyed=true;this.progress++;this.audio.play('hit');
    if(this.progress>=3)this.award();else this.refreshVisible();return true;
  }
  waypoint(dragon) {
    if(this.stage===0)return dragon.group.position;
    if(this.stage===1)return this.rings[this.progress]?.position??null;
    if(this.stage===2)return this.nearest(this.crystals.filter(g=>!g.userData.collected),dragon.group.position)?.position??null;
    if(this.stage===3)return this.nearest(this.targets.filter(g=>!g.userData.destroyed),dragon.group.position)?.position??null;
    if(this.stage===4)return this.enemies?.nearest(dragon.group.position)?.position??null;
    if(this.stage===5)return this.nearest(this.hatchlings.filter(g=>!g.userData.rescued),dragon.group.position)?.position??null;
    return null;
  }
  snapshot(){
    return {stage:this.stage,progress:this.progress,
      crystals:this.crystals.map(g=>!!g.userData.collected),
      targets:this.targets.map(g=>!!g.userData.destroyed),
      hatchlings:this.hatchlings.map(g=>!!g.userData.rescued),
      enemies:this.enemies?.enemies.map(e=>e.health)??[3,3,3]};
  }
  restore(data){
    this.stage=Math.min(7,Math.max(0,data.stage));this.progress=data.progress;
    this.crystals.forEach((g,i)=>g.userData.collected=!!data.crystals[i]);
    this.targets.forEach((g,i)=>g.userData.destroyed=!!data.targets[i]);
    this.hatchlings.forEach((g,i)=>g.userData.rescued=!!data.hatchlings[i]);
    this.enemies?.enemies.forEach((e,i)=>{e.health=data.enemies[i];e.alive=e.health>0;});
    this.refreshVisible();
  }
  nearest(groups,position) {let best=null,smallest=Infinity;for(const group of groups){const d=group.position.distanceToSquared(position);if(d<smallest){smallest=d;best=group;}}return best;}
  update(dt,time,dragon,onToast) {
    const pos=dragon.group.position;
    if(this.stage===1 && dragon.riding) {
      const ring=this.rings[this.progress];
      if(ring && pos.distanceTo(ring.position)<10.2){this.progress++;this.audio.play('pickup');onToast(`Aro atravessado · ${this.progress}/5`);
        if(this.progress>=5){this.award();onToast('Missão concluída! Agora encontre as runas.');}else this.refreshVisible();}
    }
    if(this.stage===2 && dragon.riding) {
      for(const crystal of this.crystals) if(!crystal.userData.collected && pos.distanceTo(crystal.position)<9.5){
        crystal.userData.collected=true;this.progress++;this.audio.play('pickup');onToast(`Cristal resgatado · ${this.progress}/3`);
        if(this.progress>=3){this.award();onToast('Sopro de fogo liberado! Use F.');}else this.refreshVisible();break;
      }
    }
    if(this.stage===5 && dragon.riding){
      for(const baby of this.hatchlings)if(!baby.userData.rescued && pos.distanceTo(baby.position)<9.5){
        baby.userData.rescued=true;this.progress++;this.audio.play('rescue');onToast(`Filhote resgatado · ${this.progress}/3`);
        if(this.progress>=3){this.award();onToast('Todos os filhotes salvos! Brumária está em paz.',6);}
        else this.refreshVisible();
        break;
      }
    }
    this.hatchlings.forEach((baby,i)=>{if(!baby.visible)return;
      baby.userData.ring.rotation.z+=dt*.5;
      baby.children[0].rotation.y=Math.sin(time*2+i)*.14;
      for(const {w,side} of baby.userData.wings)w.rotation.z=side*Math.sin(time*8+i)*.33;
      baby.position.y=HATCHLING_POSITIONS[i][1]+Math.sin(time*2+i)*1.2;
    });
    this.rings.forEach((ring,i)=>{if(ring.visible){ring.rotation.z+=dt*.16;ring.scale.setScalar(1+Math.sin(time*2.5)*.025);}});
    this.crystals.forEach((crystal,i)=>{if(crystal.visible){crystal.rotation.y+=dt*.5;crystal.children[0].rotation.z+=dt*.4;}});
    this.targets.forEach((target,i)=>{if(target.visible){target.rotation.y+=dt*.35;target.children[1].scale.setScalar(1+Math.sin(time*4+i)*.12);}});
  }
}
