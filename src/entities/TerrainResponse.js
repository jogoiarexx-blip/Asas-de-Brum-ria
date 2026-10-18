/** Reusable terrain sampling for grounded mounts. No GPU or save dependency. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function terrainAttitude(groundAt,x,z,yaw=0,radius=1.5){
  if(typeof groundAt!=='function'||![x,z,yaw,radius].every(Number.isFinite)||radius<=0)
    return {pitch:0,roll:0,slope:0};
  const xp=groundAt(x+radius,z),xm=groundAt(x-radius,z);
  const zp=groundAt(x,z+radius),zm=groundAt(x,z-radius);
  if(![xp,xm,zp,zm].every(Number.isFinite))return {pitch:0,roll:0,slope:0};
  const gx=(xp-xm)/(radius*2),gz=(zp-zm)/(radius*2);
  const forward=-gx*Math.sin(yaw)-gz*Math.cos(yaw);
  const right=gx*Math.cos(yaw)-gz*Math.sin(yaw);
  return {pitch:clamp(Math.atan(forward)*.31,-.22,.22),
    roll:clamp(-Math.atan(right)*.28,-.2,.2),slope:Math.hypot(gx,gz)};
}
export function terrainTraction(attitude){
  const slope=Number.isFinite(attitude?.slope)?Math.max(0,attitude.slope):0;
  return clamp(1-slope*.20,.43,1);
}
/** Preserve physical landing squash while applying the regular gait/flight bob. */
export function visualContactHeight(contactOffset=0,bob=0){
  const a=Number.isFinite(contactOffset)?contactOffset:0;
  const b=Number.isFinite(bob)?bob:0;
  return a+b;
}
