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
