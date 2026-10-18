/** Damage stage and transient sinking debris; no new save fields. */
export function shipDamageAppearance(health){
 const remaining=Number.isFinite(health)?Math.max(0,Math.min(2,health)):2;
 return {visible:remaining>0,sailScale:remaining===1?.72:remaining===0?0:1,
   mastTilt:remaining===1?.13:0,deckTilt:remaining===1?-.09:0};
}
export const SHIP_DEBRIS_DURATION=3.3;
/** Age-based motion means a loaded save never replays the destruction. */
export function shipDebrisStep(age,index=0){
 if(!Number.isFinite(age)||age<0||age>=SHIP_DEBRIS_DURATION)
   return {visible:false,sink:-8,spread:0,spin:0,scale:0};
 const t=age/SHIP_DEBRIS_DURATION;
 return {visible:true,sink:-7*t*t,spread:(index+1)*.8+age*1.8,
   spin:age*(.6+index*.27),scale:Math.max(.01,1-t*.7)};
}
/** A whole hull rotates and sinks for a short time; save only stores the damage. */
export function shipSinkingPose(age){
 if(!Number.isFinite(age)||age<0||age>=SHIP_DEBRIS_DURATION)
   return {visible:false,offsetY:-10,roll:0};
 const t=age/SHIP_DEBRIS_DURATION;
 return {visible:true,offsetY:-9*t*t,roll:t*.58};
}
