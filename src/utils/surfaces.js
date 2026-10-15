import {obstacleBlocks,overlapsCircle} from './collision.js';

/** The floor of a raised platform takes precedence only where the walkable top exists. */
export function surfaceHeightAt(terrainY,x,z,surfaces=[]) {
  let height=terrainY;
  for(const surface of surfaces){
    const dx=x-surface.x,dz=z-surface.z;
    if(dx*dx+dz*dz<=surface.radius*surface.radius){
      height=Math.max(height,surface.top);
    }
  }
  return height;
}

/** Find a clear nearby dismount position instead of placing the rider inside a prop. */
export function safeDismountSpot(origin,{obstacles=[],walkable=()=>true,groundAt=()=>0,radius=.52,maxHeightDelta=1.6}={}) {
  const originHeight=groundAt(origin.x,origin.z);
  for(const distance of [2.8,4,5.3]){
    for(let index=0;index<12;index++){
      const angle=Math.PI/4+index*Math.PI/6;
      const x=origin.x+Math.cos(angle)*distance;
      const z=origin.z+Math.sin(angle)*distance;
      if(!walkable(x,z))continue;
      const ground=groundAt(x,z);
      if(!Number.isFinite(ground)||Math.abs(ground-originHeight)>maxHeightDelta)continue;
      const blocked=obstacles.some(o=>obstacleBlocks(o,ground+1.1,1.1)&&overlapsCircle(x,z,radius,o));
      if(!blocked)return {x,z,y:ground};
    }
  }
  return null;
}
