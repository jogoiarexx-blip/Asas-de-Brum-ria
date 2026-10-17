import * as THREE from 'three';
import {moveWithCollisions,obstacleBlocks} from '../utils/collision.js';
const material = color => new THREE.MeshLambertMaterial({color});
function buildHero() {
  const g=new THREE.Group();
  const leather=material(0x62452d),coat=material(0x3a655d),skin=material(0xe8b88c),hair=material(0x332e2d),metal=material(0xc9b483);
  const add=(geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{
    const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;g.add(m);return m;
  };
  add(new THREE.CylinderGeometry(.36,.45,.94,8),coat,0,1.06,0);
  add(new THREE.SphereGeometry(.34,10,8),skin,0,1.86,-.03);
  add(new THREE.SphereGeometry(.36,10,8),hair,0,2.03,.035,1,.6,1);
  add(new THREE.BoxGeometry(.72,.13,.49),leather,0,.71,0);
  add(new THREE.BoxGeometry(.53,.15,.11),metal,0,1.15,-.42);
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const leg=new THREE.Group();leg.position.set(side*.2,.65,0);
    const boot=new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,.66,7),leather);boot.position.y=-.32;leg.add(boot);g.add(leg);legs.push(leg);
    const arm=new THREE.Group();arm.position.set(side*.49,1.40,0);
    const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.18,.16,.7,8),coat);sleeve.position.y=-.33;arm.add(sleeve);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),skin);hand.position.y=-.73;arm.add(hand);g.add(arm);arms.push(arm);
  }
  const cape=add(new THREE.ConeGeometry(.67,1.4,4),material(0x943d43),0,.62,.4,1,1,.25);cape.rotation.x=.13;
  g.userData={legs,arms,cape};return g;
}
export class Hero {
  constructor(scene,world,dragon) {
    this.world=world;this.dragon=dragon;
    this.group=buildHero();this.group.position.set(2,world.groundHeightAt(2,11,.52),11);scene.add(this.group);
    this.rider=buildHero();this.rider.position.set(0,.75,-.03);this.rider.rotation.y=0;
    this.rider.scale.setScalar(.78);dragon.visual.add(this.rider);this.rider.visible=false;
    this.mounted=false;this.walkTime=0;this.moveSpeed=0;
  }
  setMounted(value) { this.mounted=value;this.group.visible=!value;this.rider.visible=value; }
  update(dt,input,time) {
    if(this.mounted) {
      this.moveSpeed=0;
      const {legs,arms,cape}=this.rider.userData;
      for(let i=0;i<2;i++) { legs[i].rotation.x=-.75;legs[i].rotation.z=(i===0?1:-1)*.20;arms[i].rotation.x=-.7; }
      cape.rotation.x=.2+Math.sin(time*4)*.06;
      return;
    }
    const dx=(input.isDown('d','arrowright')?1:0)-(input.isDown('a','arrowleft')?1:0);
    const dz=(input.isDown('s','arrowdown')?1:0)-(input.isDown('w','arrowup')?1:0);
    let moving=!!(dx||dz);
    if(moving){
      const len=Math.hypot(dx,dz),step=(input.isDown('shift')?3.1:9)*dt;const nx=this.group.position.x+dx/len*step,nz=this.group.position.z+dz/len*step;
      const result=moveWithCollisions(this.group.position,{x:nx-this.group.position.x,z:nz-this.group.position.z},.52,this.world.obstacles,(x,z)=>this.world.walkable(x,z),o=>obstacleBlocks(o,this.group.position.y+1.1,1.1),{groundAt:(x,z)=>this.world.groundHeightAt(x,z,.52),maxStepUp:1.1});
      this.moveSpeed=Math.hypot(result.x-this.group.position.x,result.z-this.group.position.z)/Math.max(dt,.001);
      moving=this.moveSpeed>.0001;
      this.group.position.x=result.x;this.group.position.z=result.z;
      this.group.rotation.y=Math.atan2(-dx/len,-dz/len);
      this.walkTime+=dt*(input.isDown('shift')?5.2:11);
    }
    if(!moving)this.moveSpeed=0;
    this.group.position.y=this.world.groundHeightAt(this.group.position.x,this.group.position.z,.52);
    const {legs,arms,cape}=this.group.userData;
    legs.forEach((leg,i)=>leg.rotation.x=THREE.MathUtils.damp(leg.rotation.x,moving?Math.sin(this.walkTime+i*Math.PI)*(input.isDown('shift')?.29:.52):0,10,dt));
    arms.forEach((arm,i)=>arm.rotation.x=THREE.MathUtils.damp(arm.rotation.x,moving?Math.sin(this.walkTime+i*Math.PI)*-.42:0,10,dt));
    cape.rotation.x=.13+(moving?Math.sin(time*9)*.08:0);
  }
}
