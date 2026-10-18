/** Deterministic arcade-flight combat helpers, isolated from Three.js and saves. */
export const DODGE_COST=18;
export const DODGE_DURATION=.34;
export const DODGE_COOLDOWN=2.25;
export const DODGE_SPEED=26;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export function canDodge({riding=false,airborne=false,energy=0,cooldown=0}={}){
  return riding&&airborne&&Number.isFinite(energy)&&energy>=DODGE_COST&&cooldown<=0;
}
export function startDodge(options={}){
  if(!canDodge(options))return {ok:false,cost:0,duration:0,cooldown:Math.max(0,options.cooldown??0),side:0};
  const {axis=0,previousSide=1}=options;
  const side=Math.abs(axis)>.22?Math.sign(axis):-(previousSide||1);
  return {ok:true,side,cost:DODGE_COST,duration:DODGE_DURATION,cooldown:DODGE_COOLDOWN};
}
export function advanceDodge({remaining=0,cooldown=0}={},dt=0){
  const step=Number.isFinite(dt)?Math.max(0,dt):0;
  return {remaining:Math.max(0,remaining-step),cooldown:Math.max(0,cooldown-step)};
}
export function dodgeImpulse(yaw,side,dt,remaining){
  const time=Math.min(Math.max(0,dt),Math.max(0,remaining));
  const displacement=DODGE_SPEED*time*(side===-1?-1:side===1?1:0);
  return {x:Math.cos(yaw)*displacement,z:-Math.sin(yaw)*displacement};
}
/** Four clearly distinguishable visual states, no change to expedition save. */
export function bossDamageStage(health){
  if(!Number.isFinite(health))return 0;
  if(health<=0)return 4;
  if(health<=2)return 3;
  if(health<=4)return 2;
  if(health<=8)return 1;
  return 0;
}
/** Predict only up to 12 world units. Shots never steer once spawned. */
export function bossAimPoint(from,target,heading,speed=0){
  const distance=Math.hypot(target.x-from.x,target.y-from.y,target.z-from.z);
  const travel=Math.min(.5,distance/56);
  const amount=clamp(Number.isFinite(speed)?Math.max(0,speed)*travel:0,0,12);
  const hx=Number.isFinite(heading?.x)?heading.x:0,hz=Number.isFinite(heading?.z)?heading.z:0;
  const norm=Math.max(1,Math.hypot(hx,hz));
  return {x:target.x+hx/norm*amount,y:target.y,z:target.z+hz/norm*amount};
}
/** Lateral pursuit orbit instead of exclusively flying directly at the player. */
export function enemyFlank(distance,time,index){
  if(!Number.isFinite(distance)||distance>155||distance<28)return 0;
  const magnitude=clamp((distance-28)*.22,0,13);
  return magnitude*Math.sin((Number.isFinite(time)?time:0)*.55+index*2.3+1.1);
}
