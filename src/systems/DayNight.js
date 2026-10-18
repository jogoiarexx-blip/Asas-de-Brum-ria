import * as THREE from 'three';
import {advanceDayCycle,advanceClockHours,clockLabel,daylight,normalizeDayCycle} from './dayCycleMath.js';

/** Astros e estrelas usam primitivas locais, sem texturas ou rede. */
export class DayNight {
  constructor(scene,world,initial){
    this.scene=scene;this.world=world;this.state=normalizeDayCycle(initial);
    this.moon=new THREE.Mesh(new THREE.SphereGeometry(20,14,12),new THREE.MeshBasicMaterial({color:0xc1d9fc,fog:false,transparent:true,opacity:.92,depthWrite:false}));
    scene.add(this.moon);
    const stars=[];let seed=43179;
    const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<270;i++){
      const theta=random()*Math.PI*2, y=.1+random()*.88;
      const r=510*Math.sqrt(1-y*y);
      stars.push(Math.cos(theta)*r,y*510,Math.sin(theta)*r);
    }
    this.starGeometry=new THREE.BufferGeometry();this.starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
    this.starMaterial=new THREE.PointsMaterial({color:0xe8f3ff,size:2.15,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,depthTest:true,fog:false});
    this.stars=new THREE.Points(this.starGeometry,this.starMaterial);this.stars.renderOrder=900;scene.add(this.stars);
    this.clock=clockLabel(this.state.phase);
  }
  snapshot(){return {...this.state};}
  // Avança a hora do céu sem confundir minutos de jogo com horas do relógio.
  jumpHours(hours=3){this.state=advanceClockHours(this.state,hours);this.clock=clockLabel(this.state.phase);}
  update(dt,focus){
    this.state=advanceDayCycle(this.state,dt);
    this.clock=clockLabel(this.state.phase);
    const phase=this.state.phase,d=daylight(phase);
    const a=phase*Math.PI*2-Math.PI/2;
    const x=Math.cos(a)*400,y=Math.sin(a)*285,z=-380;
    this.world.sunOrb.position.set(focus.x+x,focus.y+y,focus.z+z);
    this.world.sunOrb.visible=d.altitude>-.04;
    this.moon.position.set(focus.x-x,focus.y-y,focus.z-z);
    this.moon.visible=d.altitude<.08;
    this.world.sun.position.set(focus.x+x*.36,Math.max(40,focus.y+y*.57),focus.z+z*.36);
    this.world.sun.target.position.set(focus.x,0,focus.z);
    this.world.sun.target.updateMatrixWorld();
    this.stars.position.set(focus.x,focus.y,focus.z);
    this.starMaterial.opacity=d.stars*.88;
    this.stars.visible=d.stars>.01;
  }
}
