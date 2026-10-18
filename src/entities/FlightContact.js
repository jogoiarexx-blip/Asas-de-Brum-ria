/** Lightweight procedural takeoff and landing contact. No render dependency. */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function flightContactPose({phase='ground',takeoffTime=0,landingTimer=0}={}){
 let crouch=0;
 if(phase==='takeoff'){
   // Compress then push away, blending into regular airborne animation.
   const t=clamp(takeoffTime/.32,0,1);
   crouch=Math.sin(Math.PI*t)*.62;
 }else if(phase==='landing'){
   const t=clamp(landingTimer/.52,0,1);
   crouch=Math.sin(Math.PI*t)*.51;
 }
 return {crouch,offsetY:-.27*crouch,wingFold:crouch*.19,headDip:crouch*.11};
}
/** Particles are from the existing instanced effects pool, not new lights. */
export function contactBurstSize(kind,speed=0,hasGround=false,tier='balanced'){
 if(!hasGround||(kind!=='takeoff'&&kind!=='landing'))return 0;
 const base=tier==='economy'?2:tier==='quality'?6:4;
 return Math.min(12,base+(kind==='landing'&&speed>6?2:0));
}
