/** Small, deterministic terrain contact helpers for the walking hero. */
const clamp=(x,low,high)=>Math.max(low,Math.min(high,x));
export function groundFollow({y,velocity=0,target,dt}){
  if(!Number.isFinite(target)||!Number.isFinite(y))return {y:Number.isFinite(y)?y:0,velocity:0};
  if(target>=y)return {y:target,velocity:0};
  const delta=clamp(Number.isFinite(dt)?dt:0,0,.05);
  const falling=clamp(velocity-48*delta,-20,0);
  const next=Math.max(target,y+falling*delta);
  return {y:next,velocity:next<=target?0:falling};
}
export function terrainLean(x,z,heightAt){
  const hL=heightAt(x-1,z),hR=heightAt(x+1,z),hF=heightAt(x,z-1),hB=heightAt(x,z+1);
  const roll=clamp(Math.atan2(hR-hL,2)*.28,-.14,.14);
  const pitch=clamp(Math.atan2(hB-hF,2)*.28,-.14,.14);
  return {pitch,roll};
}
