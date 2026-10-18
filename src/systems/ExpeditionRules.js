/** Side campaign state, deliberately independent of the seven-story-mission save. */
export const MOUNTAIN_PORTAL=Object.freeze({x:328,z:35,loadAt:292,enterAt:355,exitAt:752});
export const MOUNTAIN_ENTRY=Object.freeze({x:798,z:35,y:51});
export const BOAT_POSITIONS=Object.freeze([[898,7,-90],[1050,7,143],[1206,7,-112]]);
export const GIANT_DRAGON_POSITION=Object.freeze({x:1120,y:79,z:8});
const clamp=(value,lo,hi,fallback=hi)=>Number.isFinite(value)?Math.max(lo,Math.min(hi,Math.floor(value))):fallback;
export function normalizeExpedition(data){
 const boatHealth=Array.from({length:3},(_,i)=>clamp(data?.boatHealth?.[i],0,2,2));
 const bossHealth=clamp(data?.bossHealth,0,12,12);
 const allBoats=boatHealth.every(h=>h===0);
 const phase=!allBoats?'boats':bossHealth>0?'boss':data?.rewarded===true?'complete':'return';
 return {boatHealth,bossHealth,phase,rewarded:phase==='complete',inRegion:data?.inRegion===true&&phase!=='complete'};
}
export class ExpeditionProgress {
 constructor(data){Object.assign(this,normalizeExpedition(data));}
 get boatsSunk(){return this.boatHealth.filter(v=>v===0).length;}
 hitBoat(index){
   if(this.phase!=='boats'||!Number.isInteger(index)||index<0||index>2||this.boatHealth[index]===0)return {hit:false,sunk:false};
   this.boatHealth[index]--;const sunk=this.boatHealth[index]===0;
   if(this.boatsSunk===3)this.phase='boss';
   return {hit:true,sunk,phase:this.phase};
 }
 hitBoss(){
   if(this.phase!=='boss')return {hit:false,defeated:false};
   this.bossHealth--;const defeated=this.bossHealth<=0;
   if(defeated)this.phase='return';
   return {hit:true,defeated,phase:this.phase};
 }
 completeReturn(){if(this.phase!=='return')return false;this.phase='complete';this.rewarded=true;this.inRegion=false;return true;}
 snapshot(){return {boatHealth:[...this.boatHealth],bossHealth:this.bossHealth,phase:this.phase,rewarded:this.rewarded,inRegion:this.inRegion};}
}
const inCorridor=(p)=>Math.abs(p.z-MOUNTAIN_PORTAL.z)<95;
export const shouldLoadMountain=(p,riding=false)=>riding&&p.y>14&&p.x>MOUNTAIN_PORTAL.loadAt&&p.x<425&&inCorridor(p);
export const shouldEnterMountain=(p,riding=false)=>riding&&p.y>14&&p.x>MOUNTAIN_PORTAL.enterAt&&inCorridor(p);
export const shouldExitMountain=(p,riding=false)=>riding&&p.x<MOUNTAIN_PORTAL.exitAt&&p.x>650;

/** Hold the mount at the gate while the asynchronously imported level is absent.
 * Otherwise a fast flying dragon can pass x=425 before the chunk finishes loading. */
export function shouldHoldMountainGate(p,riding=false,unlocked=false,loaded=false){
 return riding&&unlocked&&!loaded&&p.y>14&&p.x>=MOUNTAIN_PORTAL.enterAt&&
   p.x<650&&Math.abs(p.z-MOUNTAIN_PORTAL.z)<95;
}
