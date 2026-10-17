import * as THREE from 'three';
import {moveWithCollisions,obstacleBlocks} from '../utils/collision.js';
import {buildHero} from './heroVisual.js';
import {walkIntent,poseForHero} from './heroMotion.js';
import {HERO_GLB_URL,HERO_MODEL_FACING_YAW} from './heroAssetConfig.js';
import {loadOptionalHeroGLB,updateOptionalHeroGLB} from './heroAssetLoader.js';

export class Hero {
  constructor(scene,world,dragon) {
    this.world=world;this.dragon=dragon;
    this.group=buildHero();this.group.position.set(2,world.groundHeightAt(2,11,.52),11);scene.add(this.group);
    this.rider=buildHero();this.rider.position.set(0,.75,-.03);this.rider.rotation.y=0;
    this.rider.scale.setScalar(.78);dragon.visual.add(this.rider);this.rider.visible=false;
    this.mounted=false;this.walkTime=0;this.moveSpeed=0;
    if(HERO_GLB_URL)loadOptionalHeroGLB(this,HERO_GLB_URL,{yaw:HERO_MODEL_FACING_YAW});
  }
  setMounted(value){this.mounted=value;this.group.visible=!value;this.rider.visible=value;}
  animate(model,pose,dt,now,mounted=false){
    const {legs,arms,cape,body,head}=model.userData;
    legs.forEach((leg,i)=>{
      const phase=i===0?1:-1;
      leg.hip.rotation.x=THREE.MathUtils.damp(leg.hip.rotation.x,mounted?-.73:pose.stride*phase,12,dt);
      leg.knee.rotation.x=THREE.MathUtils.damp(leg.knee.rotation.x,mounted?.86:Math.max(0,-pose.stride*phase)*.75+pose.footLift*.2,11,dt);
    });
    arms.forEach((arm,i)=>{
      const phase=i===0?-1:1;
      arm.shoulder.rotation.x=THREE.MathUtils.damp(arm.shoulder.rotation.x,mounted?-.7:pose.arm*phase,11,dt);
      arm.elbow.rotation.x=THREE.MathUtils.damp(arm.elbow.rotation.x,mounted?-.64:-.18,10,dt);
    });
    body.rotation.z=THREE.MathUtils.damp(body.rotation.z,mounted?Math.sin(now*2)*.015:pose.sway,7,dt);
    body.scale.y=THREE.MathUtils.damp(body.scale.y,1+pose.breath,4,dt);
    head.rotation.y=THREE.MathUtils.damp(head.rotation.y,pose.headTurn,3,dt);
    body.rotation.x=THREE.MathUtils.damp(body.rotation.x,pose.bodyLean,7,dt);
    cape.rotation.x=THREE.MathUtils.damp(cape.rotation.x,pose.cape+Math.sin(now*(mounted?6:9))*.04,5,dt);
  }
  update(dt,input,time){
    updateOptionalHeroGLB(this,dt);
    if(this.mounted){
      this.moveSpeed=0;this.animate(this.rider,poseForHero(time,1,true,false),dt,time,true);return;
    }
    const x=input.axis?.('a','d')??((input.isDown('d','arrowright')?1:0)-(input.isDown('a','arrowleft')?1:0));
    const z=input.axis?.('w','s')??((input.isDown('s','arrowdown')?1:0)-(input.isDown('w','arrowup')?1:0));
    const intent=walkIntent(x,z),slow=input.isDown('shift');
    let moving=intent.strength>.001;
    if(moving){
      const step=(slow?3.1:9)*intent.strength*dt;
      const dx=intent.x/intent.strength*step,dz=intent.z/intent.strength*step;
      const result=moveWithCollisions(this.group.position,{x:dx,z:dz},.52,this.world.obstacles,
        (px,pz)=>this.world.walkable(px,pz),
        o=>obstacleBlocks(o,this.group.position.y+1.1,1.1),
        {groundAt:(px,pz)=>this.world.groundHeightAt(px,pz,.52),maxStepUp:1.1});
      const vx=result.x-this.group.position.x,vz=result.z-this.group.position.z;
      this.moveSpeed=Math.hypot(vx,vz)/Math.max(dt,.001);
      moving=this.moveSpeed>.001;
      this.group.position.x=result.x;this.group.position.z=result.z;
      const targetYaw=Math.atan2(-intent.x,-intent.z);
      // Prevent instantaneous 180-degree snapping when reversing direction.
      let change=Math.atan2(Math.sin(targetYaw-this.group.rotation.y),Math.cos(targetYaw-this.group.rotation.y));
      this.group.rotation.y+=change*Math.min(1,dt*13);
      this.walkTime+=dt*(slow?6.2:12.5)*intent.strength;
    } else this.moveSpeed=0;
    if(!moving)this.moveSpeed=0;
    this.group.position.y=this.world.groundHeightAt(this.group.position.x,this.group.position.z,.52);
    const pose=poseForHero(this.walkTime,moving?Math.min(1,this.moveSpeed/(slow?3.1:9)):0,false,!slow);
    this.animate(this.group,pose,dt,time);
  }
}
