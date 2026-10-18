import {enemyFlank} from './AerialCombat.js';
/** Stateless enemy decision-making. The existing patrol/chase systems still
 * control quests and hitboxes; this only alters movement targets. */
export function enemyCombatPlan({distance=Infinity,health=3,evadeTime=0,index=0,time=0}={}){
 if(!Number.isFinite(distance)||distance>=153)return {mode:'patrol',flank:0,retreat:0,speed:16};
 if(Number.isFinite(evadeTime)&&evadeTime>0){
   const side=(index%2===0?1:-1);
   return {mode:'evade',flank:side*(13+Math.min(7,evadeTime*5)),retreat:8,speed:26};
 }
 if(distance<26)return {mode:'retreat',flank:enemyFlank(distance,time,index),retreat:32,speed:13};
 if(health<=1)return {mode:'flank',flank:enemyFlank(distance,time,index)*1.3,retreat:4,speed:27};
 return {mode:'flank',flank:enemyFlank(distance,time,index),retreat:2,speed:25};
}
