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
 const warningStart=duration-BOSS_WARNING_SECONDS;
 let warn=false,fire=false;
 // If the cadence changes mid-battle, always start a warning before shooting.
 if(elapsed>=warningStart&&!warned){warn=true;warned=true;}
 if(elapsed>=duration){
   if(!state?.warned){elapsed=warningStart;warn=true;warned=true;}
   else{fire=true;elapsed=0;warned=false;warn=false;}
 }
 return {state:{elapsed,warned},fire,warn,charging:warned};
}
