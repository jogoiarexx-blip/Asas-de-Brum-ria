import {GIANT_DRAGON_POSITION} from './ExpeditionRules.js';
import {bossMotionTarget} from './BossMotion.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
/** Tactical phases can change without touching the quest progress/save schema. */
export function bossBattleTactic(distance,health=12){
  if(!Number.isFinite(distance)||distance<0)return {mode:'orbit',speed:11};
  if(distance<65)return {mode:'retreat',speed:13};
  if(distance>210)return {mode:'approach',speed:13};
  return health<=6?{mode:'aggressive',speed:17}:{mode:'orbit',speed:11};
}
/** A bounded aerial arena. The boss adjusts the patrol to the rider's location,
 * while preserving the telegraphed shot's fixed origin during the warning. */
export function bossBattleDestination(time=0,health=12,rider=null){
  const base=bossMotionTarget(time,health);
  if(!rider||![rider.x,rider.y,rider.z].every(Number.isFinite))return base;
  const origin=GIANT_DRAGON_POSITION;
  const distance=Math.hypot(base.x-rider.x,base.y-rider.y,base.z-rider.z);
  if(distance>390)return base;
  const tactic=bossBattleTactic(distance,health);
  const dx=clamp(rider.x-origin.x,-100,100),dz=clamp(rider.z-origin.z,-100,100);
  const shift=tactic.mode==='retreat'?-.18:tactic.mode==='approach'?.35:tactic.mode==='aggressive'?.25:.12;
  const orbit=Math.sin((Number.isFinite(time)?time:0)*.46);
  return {x:clamp(base.x+dx*shift-dz*.09*orbit,1078,1158),
    y:clamp(base.y+clamp((rider.y-origin.y)*.12,-5,5),60,101),
    z:clamp(base.z+dz*shift+dx*.09*orbit,-35,51)};
}
