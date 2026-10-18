/** Contact checks independent of Three.js: never land on water, steep terrain,
 * moving too fast or directly underneath a tall obstructing collider.
 */
export function inspectLanding({x,z,radius=1.15,speed=0,verticalSpeed=0,
  groundAt=()=>-Infinity,walkable=()=>false,clearanceAt=()=>-Infinity,
  maxSlope=1.65,maxSpeed=9,maxDescent=9}={}){
  const ground=groundAt(x,z);
  if(!Number.isFinite(ground)||!walkable(x,z))return {safe:false,reason:'surface',ground};
  if(!Number.isFinite(speed)||!Number.isFinite(verticalSpeed)||
     Math.abs(speed)>maxSpeed||verticalSpeed< -maxDescent)
    return {safe:false,reason:'speed',ground};
  let min=ground,max=ground;
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4,px=x+Math.cos(angle)*radius,pz=z+Math.sin(angle)*radius;
    const h=groundAt(px,pz);
    if(!Number.isFinite(h)||!walkable(px,pz))return {safe:false,reason:'edge',ground};
    min=Math.min(min,h);max=Math.max(max,h);
  }
  if(max-min>maxSlope)return {safe:false,reason:'slope',ground};
  // Any obstacle whose top is higher than the body center while touching the
  // ground makes this a hazardous parking location.
  const obstruction=clearanceAt(x,z,radius);
  if(Number.isFinite(obstruction)&&obstruction>ground+.25)
    return {safe:false,reason:'obstacle',ground};
  return {safe:true,reason:'ok',ground};
}

/** Momentum is dissipated on contact, with a short visual kick only on hard hits. */
export function flightCollisionResponse({speed=0,blockedHorizontal=false,blockedVertical=false,verticalSpeed=0}={}){
  const collided=Boolean(blockedHorizontal||blockedVertical);
  const normalSpeed=Number.isFinite(speed)?Math.max(0,speed):0;
  const down=Number.isFinite(verticalSpeed)?Math.max(0,-verticalSpeed):0;
  return {collided,speed:blockedHorizontal?Math.min(normalSpeed,8):normalSpeed,
    intensity:collided?Math.min(1,Math.max(0,(normalSpeed-8)/38, (blockedVertical?down:0)/26)):0};
}
