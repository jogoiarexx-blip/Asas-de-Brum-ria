/** Circle-based collision for scenery props, with small swept steps and axis sliding.
 * Obstacle coordinates describe an X/Z footprint and Y extent.
 * Pure math so collision behavior can be regression-tested without WebGL.
 */
export function overlapsCircle(x,z,radius,obstacle) {
  const dx=x-obstacle.x,dz=z-obstacle.z;
  const sum=radius+obstacle.radius;
  return dx*dx+dz*dz < sum*sum;
}
export function obstacleBlocks(obstacle, centerY, halfHeight=1) {
  return centerY+halfHeight>obstacle.bottom && centerY-halfHeight<obstacle.top;
}
export function obstacleCeiling(x,z,radius,obstacles) {
  let ceiling=-Infinity;
  for(const o of obstacles) if(overlapsCircle(x,z,radius,o)) ceiling=Math.max(ceiling,o.top);
  return ceiling;
}
/**
 * Moves without tunneling through trees or cabins when boosting at low altitude.
 * Each substep resolves X and Z independently, yielding predictable wall sliding.
 */
export function moveWithCollisions(start,delta,radius,obstacles,canOccupy=()=>true,blocks=()=>true,options={}) {
  const distance=Math.hypot(delta.x,delta.z);
  const stepLength=Math.max(.24,radius*.4);
  const steps=Math.max(1,Math.ceil(distance/stepLength));
  const dx=delta.x/steps,dz=delta.z/steps;
  let x=start.x,z=start.z,blocked=false;
  // Broad-phase sweep: only examine obstacles in the expanded travel corridor.
  const lowX=Math.min(start.x,start.x+delta.x)-radius;
  const highX=Math.max(start.x,start.x+delta.x)+radius;
  const lowZ=Math.min(start.z,start.z+delta.z)-radius;
  const highZ=Math.max(start.z,start.z+delta.z)+radius;
  const candidates=obstacles.filter(o=>
    o.x+o.radius>=lowX&&o.x-o.radius<=highX&&
    o.z+o.radius>=lowZ&&o.z-o.radius<=highZ&&blocks(o));
  const groundAt=options.groundAt;
  const maxStepUp=options.maxStepUp??Infinity;
  const free=(tx,tz,cx,cz)=>canOccupy(tx,tz)&&(!groundAt||groundAt(tx,tz)<=groundAt(cx,cz)+maxStepUp)&&!candidates.some(o=>{
    if(!overlapsCircle(tx,tz,radius,o))return false;
    if(!overlapsCircle(cx,cz,radius,o))return true;
    // Permit leaving a collision volume already occupied by an older save.
    const before=(cx-o.x)**2+(cz-o.z)**2;
    const after=(tx-o.x)**2+(tz-o.z)**2;
    return after<before-1e-10;
  });
  for(let i=0;i<steps;i++) {
    if(free(x+dx,z,x,z))x+=dx;else if(Math.abs(dx)>1e-7)blocked=true;
    if(free(x,z+dz,x,z))z+=dz;else if(Math.abs(dz)>1e-7)blocked=true;
  }
  return {x,z,blocked,...(groundAt?{groundY:groundAt(x,z)}:{})};
}


/** Cylinders drawn by Landmarks: broad base and a narrower high column.
 * Use vertical slices so flying above the pedestal remains possible.
 */
export function landmarkCollisionVolumes(x,z,groundY) {
  return [
    {x,z,radius:4.3,bottom:groundY,top:groundY+1.5,type:'landmark-base'},
    {x,z,radius:2.1,bottom:groundY+1.25,top:groundY+9.55,type:'landmark-pillar'},
  ];
}

/** Recover a player from overlapping props in an older save.
 * Only invoked on restore; choose the nearest valid point on the ground,
 * without moving characters that already occupy a legal position.
 */
export function recoverFreePosition(start,radius,obstacles,canOccupy=()=>true,blocks=()=>true,options={}) {
  const pad=options.padding??.08;
  const valid=(x,z)=>canOccupy(x,z) && !obstacles.some(o=>blocks(o)&&overlapsCircle(x,z,radius+pad,o));
  if(valid(start.x,start.z))return {x:start.x,z:start.z,recovered:false};
  const groundAt=options.groundAt;
  const originalY=groundAt?.(start.x,start.z);
  const maxHeightDelta=options.maxHeightDelta??2.2;
  const step=.3, maxRadius=options.maxRadius??18, angles=32;
  for(let distance=step;distance<=maxRadius;distance+=step){
    for(let k=0;k<angles;k++) {
      const angle=k/angles*Math.PI*2;
      const x=start.x+Math.cos(angle)*distance, z=start.z+Math.sin(angle)*distance;
      if(groundAt && Math.abs(groundAt(x,z)-originalY)>maxHeightDelta)continue;
      if(valid(x,z))return {x,z,recovered:true};
    }
  }
  return null;
}
