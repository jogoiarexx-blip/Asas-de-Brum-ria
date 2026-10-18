/** Pure rules for the hatchling rescue escort. Scene and mission independent. */
export const RESCUE_HOVER_SECONDS=1.25;
export const RESCUE_NEST=Object.freeze([0,29,0]);
export function rescueApproach({distance,speed,riding,dt,hold=0}){
  if(!riding||!Number.isFinite(distance)||distance>9.5||!Number.isFinite(speed)||speed>12)return 0;
  return Math.min(RESCUE_HOVER_SECONDS,Math.max(0,hold)+Math.max(0,Math.min(.05,dt)));
}
export function deliveryReady({distance,speed,riding}){
  return !!riding&&Number.isFinite(distance)&&distance<14&&Number.isFinite(speed)&&speed<18;
}
