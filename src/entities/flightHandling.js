import {clamp} from '../utils/math.js';
/** Flight steering becomes steadier at speed; ground turning is unchanged. */
export function steeringRate(speed,airborne){
  return airborne?1.25-.32*clamp(Math.max(0,speed)/52,0,1):1.7;
}
/** Inertial bank, with bounded gust response so it cannot spin the model. */
export function bankTarget(turn,speed,airborne,gustX=0){
  if(!airborne)return clamp(-turn*.065,-.08,.08);
  return clamp(-turn*(.18+.19*clamp(Math.max(0,speed)/50,0,1))+clamp(gustX*.045,-.055,.055),-.41,.41);
}
/** Subtle aerodynamic pitch from actual climb/descent velocity. */
export function flightPitch(verticalSpeed,airborne){
  return airborne?clamp(-verticalSpeed*.008,-.20,.20):0;
}
/** Articulation increases toward the tail tip and opposes steering. */
export function tailYaw(turn,index,time){
  return Math.sin(time*2.5-index*.32)*(.06+index*.014)-turn*(.023+index*.022);
}
/** Subtle automatic landing assistance when braking close to terrain. */
export function landingDescent({airborne,speed,height,up,down}){
  if(up)return 22;
  if(down)return -20;
  return airborne && speed<7 && height>0 && height<14 ? -5 : 0;
}
/** Exponential, frame-rate independent yaw input smoothing. */
export function smoothedTurn(previous,target,dt){
  const a=1-Math.exp(-Math.max(0,dt)*11);
  return previous+(target-previous)*a;
}
