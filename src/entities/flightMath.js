import {clamp} from '../utils/math.js';
export const FLIGHT_PHASES=Object.freeze(['ground','takeoff','cruise','landing']);
/** State used by wing joints and body pitch; it never changes quest progression. */
export function flightPhase(airborne,secondsSinceTakeoff,heightAboveFloor,descending,landingTimer) {
  if(landingTimer>0&&!airborne)return 'landing';
  if(!airborne)return 'ground';
  if(secondsSinceTakeoff<.8)return 'takeoff';
  if(descending&&heightAboveFloor<5)return 'landing';
  return 'cruise';
}
/** Ease blade and wing strength into flight; returns a predictable 0..1 interval. */
export function liftBlend(airborne,secondsSinceTakeoff,landingTimer) {
  if(airborne)return clamp(secondsSinceTakeoff/.48,0,1);
  return clamp(landingTimer/.48,0,1);
}
