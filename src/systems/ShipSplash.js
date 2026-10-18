/** Inexpensive water impact rings. Instantiated only for three ship locations. */
export const SHIP_SPLASH_START=2.35;
export const SHIP_SPLASH_DURATION=1.5;
export function shipWaterSplash(age){
  if(!Number.isFinite(age)||age<SHIP_SPLASH_START||age>=SHIP_SPLASH_START+SHIP_SPLASH_DURATION)
    return {visible:false,radius:0,opacity:0};
  const progress=(age-SHIP_SPLASH_START)/SHIP_SPLASH_DURATION;
  return {visible:true,radius:1.2+progress*11.5,opacity:.75*(1-progress)*(1-progress)};
}
