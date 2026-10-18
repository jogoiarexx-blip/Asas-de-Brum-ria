/** Independent, deterministic boss attack clock with a visible warning window. */
export const BOSS_WARNING_SECONDS=.95;
export function bossAttackCadence(health=12){
 return Number.isFinite(health)&&health<=6?2.65:3.65;
}
export function bossAttackStep(state,dt,{active=false,health=12}={}){
 if(!active)return {state:{elapsed:0,warned:false},fire:false,warn:false,charging:false};
 // Simulation resumes can have huge wall-clock gaps. Never release a burst of shots.
 const safeDt=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
 const duration=bossAttackCadence(health);
 let elapsed=Math.max(0,Number.isFinite(state?.elapsed)?state.elapsed:0)+safeDt;
 let warned=state?.warned===true;
 let warnClock=warned?Math.max(0,Number.isFinite(state?.warnClock)?state.warnClock:0)+safeDt:0;
 const warningStart=duration-BOSS_WARNING_SECONDS;
 let warn=false,fire=false;
 // If the cadence changes mid-battle, always start a warning before shooting.
 if(elapsed>=warningStart&&!warned){warn=true;warned=true;warnClock=0;}
 if(elapsed>=duration){
   if(!state?.warned){elapsed=warningStart;warn=true;warned=true;warnClock=0;}
   else if(warnClock+1e-9>=BOSS_WARNING_SECONDS){fire=true;elapsed=0;warned=false;warn=false;warnClock=0;}
 }
 return {state:{elapsed,warned,warnClock},fire,warn,charging:warned};
}

/** Predictable, learnable attacks: telegraph the next type before firing. */
export function bossAttackPattern(count=0,health=12){
 const cycle=Math.max(0,Math.floor(Number.isFinite(count)?count:0));
 if(health>6)return cycle%2===0?'aimed':'fan';
 return ['aimed','fan','vertical'][cycle%3];
}
export function bossPatternLabel(pattern){
 return pattern==='fan'?'LEQUE DE FOGO — ESQUIVE ENTRE OS TIROS':
   pattern==='vertical'?'CHAMAS EM ALTURAS DIFERENTES — MUDE A ALTITUDE':
   'SOPRO DIRECIONADO — ESQUIVA LATERAL';
}
/** Fire straight projectile directions, never guided in flight. At most 3.
 * Offsets are small so a timed dodge between lanes is possible.
 */
export function bossShotDirections(aim,pattern='aimed'){
 let x=Number.isFinite(aim?.x)?aim.x:0;
 let y=Number.isFinite(aim?.y)?aim.y:0;
 let z=Number.isFinite(aim?.z)?aim.z:-1;
 let length=Math.hypot(x,y,z);
 if(length<1e-8){x=0;y=0;z=-1;length=1;}
 x/=length;y/=length;z/=length;
 const sideLength=Math.max(.001,Math.hypot(x,z));
 const rightX=-z/sideLength,rightZ=x/sideLength;
 const offsets=pattern==='fan'?[-.27,0,.27]:pattern==='vertical'?[-.22,0,.22]:[0];
 return offsets.map(amount=>{
   const vx=x+(pattern==='fan'?rightX*amount:0);
   const vy=y+(pattern==='vertical'?amount:0);
   const vz=z+(pattern==='fan'?rightZ*amount:0);
   const magnitude=Math.hypot(vx,vy,vz);
   return {x:vx/magnitude,y:vy/magnitude,z:vz/magnitude};
 });
}
