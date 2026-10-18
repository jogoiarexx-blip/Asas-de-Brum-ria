import {GIANT_DRAGON_POSITION} from './ExpeditionRules.js';
/** Bounded, deterministic orbit with occasional swoops below 50% HP. */
export function bossMotionTarget(time=0,health=12){
 const t=Number.isFinite(time)?time:0;
 const angry=Number.isFinite(health)&&health<=6;
 const phase=t*(angry?.59:.37);
 return {
  x:GIANT_DRAGON_POSITION.x+Math.sin(phase)* (angry?25:17),
  y:GIANT_DRAGON_POSITION.y+Math.sin(phase*1.67)*(angry?7:4),
  z:GIANT_DRAGON_POSITION.z+Math.cos(phase*.84)*(angry?25:18)
 };
}
/** Keep moves readable and never snap after pause/context loss. */
export function bossMotionStep(current,target,dt,{charging=false,stagger=0}={}){
 const pos={x:current.x,y:current.y,z:current.z};
 if(charging||!Number.isFinite(dt)||dt<=0||dt>.15)return pos;
 const dx=target.x-pos.x,dy=target.y-pos.y,dz=target.z-pos.z;
 const distance=Math.hypot(dx,dy,dz);
 if(!Number.isFinite(distance)||distance<1e-8)return pos;
 const max=(stagger>0?3.6:11)*dt;
 const fraction=Math.min(1,max/distance);
 return {x:pos.x+dx*fraction,y:pos.y+dy*fraction,z:pos.z+dz*fraction};
}
