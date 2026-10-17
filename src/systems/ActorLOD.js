/** Scene-only level of detail. No mission, physics or save-state dependency. */
export const ACTOR_RANGES=Object.freeze({
  economy:{wild:[48,175],enemy:[170,300],npc:[42,130]},
  balanced:{wild:[85,300],enemy:[190,420],npc:[72,210]},
  quality:{wild:[145,Infinity],enemy:[240,Infinity],npc:[130,Infinity]}
});
/** Full animations within the first distance; limited updates to the second.
 * Enemy AI/fire range is <= 153m so sentinels always run full animations in combat. */
export function actorLevel(distance,tier='balanced',kind='wild'){
  if(!Number.isFinite(distance)||distance<0)return 'full';
  const policy=ACTOR_RANGES[tier]??ACTOR_RANGES.balanced;
  const [full,hidden]=policy[kind]??policy.wild;
  return distance<=full?'full':distance<=hidden?'limited':'hidden';
}
export function shouldAnimateActor(level,elapsed=0){
  return level==='full'||level==='limited'&&elapsed>=.1;
}
/** Conservatively skip animation outside the forward hemisphere, but never
 * near the camera: flying, turning and interacting should not cause popping. */
export function withinCameraCone(camera,actor,forward,nearRadius=40){
  if(!camera||!actor||!forward)return true;
  const dx=actor.x-camera.x,dz=actor.z-camera.z;
  const distance=Math.hypot(dx,dz);
  if(!Number.isFinite(distance)||distance<=nearRadius)return true;
  const length=Math.hypot(forward.x,forward.z);
  if(length<.001)return true;
  return (dx*forward.x+dz*forward.z)/(distance*length)>-.18;
}
export function sceneActorStats(levels=[]){
  const stats={visible:0,full:0,limited:0,hidden:0};
  for(const level of levels){
    if(level==='full'||level==='limited'){stats.visible++;stats[level]++;}
    else stats.hidden++;
  }
  return stats;
}
/** Resolve visibility after the camera has moved; independent from actor logic. */
export function actorVisualLevel(observer,actor,camera,forward,tier,kind='wild'){
  const distance=observer&&actor?Math.hypot(observer.x-actor.x,observer.z-actor.z):0;
  const level=actorLevel(distance,tier,kind);
  if(level==='hidden')return level;
  // Interaction/sentry combat ranges are protected from camera-based hiding.
  const safeRange=kind==='enemy'?165:kind==='npc'?18:25;
  return distance>safeRange&&!withinCameraCone(camera,actor,forward,40)?'hidden':level;
}
/** Throttle only far-away enemy patrol logic. Within 190m all updates are
 * immediate: this includes the full 153m chase and projectile danger range. */
export function enemySimulationStep(distance,carry=0,dt=0,tier='balanced'){
  const delta=Math.max(0,Number.isFinite(dt)?dt:0);
  const accumulated=Math.max(0,Number.isFinite(carry)?carry:0)+delta;
  const far=Number.isFinite(distance)&&distance>190&&tier!=='quality';
  const interval=tier==='economy'?.20:.12;
  if(far&&accumulated<interval)return {run:false,dt:0,carry:accumulated};
  return {run:true,dt:Math.min(accumulated,.25),carry:0};
}
