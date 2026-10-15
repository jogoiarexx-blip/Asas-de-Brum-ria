import * as THREE from 'three';
import {LANDMARKS} from '../systems/Discovery.js';
/** Marcos exploráveis com desenho procedural e halo: a conquista é feita em Discovery. */
export class Landmarks {
  constructor(scene,world){
    this.scene=scene;
    this.objects=LANDMARKS.map((def,index)=>{
      const g=new THREE.Group();g.position.set(def.x,world.heightAt(def.x,def.z),def.z);
      const stone=new THREE.MeshStandardMaterial({color:0x50696d,roughness:.83,flatShading:true});
      const rune=new THREE.MeshStandardMaterial({color:index%2?0xe5cf82:0x86eff3,emissive:index%2?0x8b6435:0x2c9ca9,emissiveIntensity:1.8,metalness:.15});
      const base=new THREE.Mesh(new THREE.CylinderGeometry(3.4,4.3,1.5,7),stone);base.position.y=.75;base.receiveShadow=true;g.add(base);
      const pillar=new THREE.Mesh(new THREE.CylinderGeometry(1.2,2.1,8.3,5),stone);pillar.position.y=5.4;pillar.castShadow=true;g.add(pillar);
      for(let j=0;j<3;j++){
        const line=new THREE.Mesh(new THREE.TorusGeometry(.8,.1,5,6),rune);
        line.rotation.x=Math.PI/2;line.position.y=4+j*1.35;g.add(line);
      }
      const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(1.65),rune);crystal.position.y=10.65;g.add(crystal);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(4.2,.12,6,36),new THREE.MeshBasicMaterial({color:0xe3d8a3,transparent:true,opacity:.45}));
      ring.rotation.x=Math.PI/2;ring.position.y=1.8;g.add(ring);
      scene.add(g);return {g,crystal,ring,rune};
    });
  }
  update(time,discovery){this.objects.forEach((object,i)=>{
    const seen=discovery.found[i];object.crystal.rotation.y=time*.8+i;
    object.crystal.position.y=10.65+Math.sin(time*1.5+i)*.35;
    object.rune.emissiveIntensity=seen?.25:1.2+Math.sin(time*2+i)*.25;
    object.ring.visible=!seen;
    object.ring.scale.setScalar(1+Math.sin(time*1.3+i)*.04);
  });}
  tryDiscover(position,discovery){for(let i=0;i<LANDMARKS.length;i++){
    if(discovery.found[i])continue;
    const o=this.objects[i].g.position;
    if(Math.hypot(position.x-o.x,position.z-o.z)<13 && Math.abs(position.y-o.y)<43){return discovery.discover(i);}
  }return null;}
}
