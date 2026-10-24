import * as THREE from 'three';
import {Dragon} from '../entities/Dragon.js';
import {wingPose} from '../entities/wingPose.js';
import {updateDragonGLB,clearDragonGLB} from '../entities/dragonAssetLoader.js';
import {SPECIES} from '../systems/Progression.js';
import {applyDragonPreviewMotion} from '../entities/dragonPreviewMotion.js';

/** Prévia real dos mesmos modelos procedurais usados no voo, não uma imagem estática. */
export class StablePreview {
  constructor(canvas){
    if(!canvas)throw Error('Canvas da prévia ausente');
    this.canvas=canvas;this.scene=new THREE.Scene();
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.4;
    this.camera=new THREE.PerspectiveCamera(39,1,.1,120);
    this.camera.position.set(9,7,-16);this.camera.lookAt(0,2,-1);
    this.scene.add(new THREE.HemisphereLight(0xe6f8ff,0x28454b,2.4));
    const key=new THREE.DirectionalLight(0xffdfad,3.4);key.position.set(-7,13,-10);this.scene.add(key);
    const rim=new THREE.DirectionalLight(0x6bd6ff,2);rim.position.set(7,8,10);this.scene.add(rim);
    const platform=new THREE.Mesh(new THREE.CylinderGeometry(5.7,6,.45,48),new THREE.MeshStandardMaterial({color:0x345b62,metalness:.23,roughness:.61}));
    platform.position.y=-.45;this.scene.add(platform);
    // Dragon.constructor queries the same groundHeightAt API as the real World.
    // heightAt was obsolete and crashed every time the stable preview opened.
    const world={groundHeightAt:()=>-2,heightAt:()=>-2,obstacles:[],clearanceAt:()=>-Infinity};
    this.dragon=new Dragon(this.scene,world);
    this.dragon.group.position.set(0,2,0);
    this.dragon.visual.position.y=0;
    this.elapsed=0;this.rotation=0;this.species=null;this.motion='fly';
    // A separate WebGL context is expensive with 120k/147k triangle GLBs.
    // Limit stable previews to ~24 render passes/s without limiting gameplay.
    this.renderDebt=0;this.needsRefresh=true;this.renderInterval=1/24;
    this.dragging=false;this.lastX=0;
    canvas.addEventListener('pointerdown',ev=>{this.dragging=true;this.lastX=ev.clientX;canvas.setPointerCapture(ev.pointerId);});
    canvas.addEventListener('pointermove',ev=>{if(this.dragging){this.rotation+=(ev.clientX-this.lastX)*.013;this.lastX=ev.clientX;}});
    const release=()=>{this.dragging=false;};
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  }
  setMotion(id){
    if(!applyDragonPreviewMotion(this.dragon,id))return false;
    if(this.motion!==id)this.needsRefresh=true;
    this.motion=id;return true;
  }
  showSpecies(id){
    if(!SPECIES[id])return false;
    if(this.dragon.externalDragonModel)clearDragonGLB(this.dragon);
    this.species=id;this.needsRefresh=true;this.dragon.setSpecies(id,SPECIES[id]);
    const name=document.getElementById('stable-preview-name');
    if(name)name.textContent=`${SPECIES[id].name} · ${SPECIES[id].kind}`;
    const caption=document.getElementById('stable-preview-caption');
    if(caption)caption.textContent='Arraste para girar · Visualização 3D do modelo usado no jogo';
    return true;
  }
  render(dt){
    this.renderDebt+=Math.max(0,Math.min(dt,.12));
    if(this.renderDebt<this.renderInterval&&!this.needsRefresh&&!this.dragging)return;
    const frameDt=this.renderDebt;
    this.renderDebt=0;this.needsRefresh=false;
    const width=Math.max(1,Math.floor(this.canvas.clientWidth)),height=Math.max(1,Math.floor(this.canvas.clientHeight));
    if(width<10||height<10)return;
    const scale=this.renderer.getPixelRatio();
    if(this.canvas.width!==Math.round(width*scale)||this.canvas.height!==Math.round(height*scale)){
      this.renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();
    }
    this.elapsed+=Math.min(frameDt,.12);
    if(!this.dragging)this.rotation+=Math.min(frameDt,.12)*.13;
    this.dragon.group.rotation.y=this.rotation;
    this.setMotion(this.motion);
    const phase=this.dragon.pose, speed=this.dragon.speed;
    for(const {wing,elbow,tip,side} of this.dragon.wings){
      const pose=wingPose({time:this.elapsed,side,phase,speed,wingLift:this.dragon.airborne?1:0,bank:0,climbing:0});
      wing.rotation.z=pose.shoulder;elbow.rotation.z=pose.elbow;tip.rotation.z=pose.wrist;
      wing.rotation.x=pose.twist;
    }
    this.dragon.headPivot.rotation.y=Math.sin(this.elapsed*.85)*.085;
    this.dragon.visual.position.y=Math.sin(this.elapsed*1.65)*.14;
    updateDragonGLB(this.dragon,frameDt);
    this.renderer.render(this.scene,this.camera);
  }
}
