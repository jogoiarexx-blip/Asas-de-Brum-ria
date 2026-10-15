/** Camera orbit independent from Three.js: no storage or saved-game schema changes. */
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function cameraOffset({forwardX=0,forwardZ=-1,distance=14,yaw=0,pitch=0}={}){
  const d=clamp(Number.isFinite(distance)?distance:14,2,80);
  const a=Number.isFinite(yaw)?yaw:0;
  const cos=Math.cos(a),sin=Math.sin(a);
  return {
    x:(-forwardX*cos-forwardZ*sin)*d,
    z:(forwardX*sin-forwardZ*cos)*d,
    y:Math.sin(clamp(pitch,-.3,.8))*d,
  };
}
export class CameraOrbit {
  constructor(){this.yaw=0;this.pitch=0;this.zoom=1;}
  drag(deltaX=0,deltaY=0){
    this.yaw+=clamp(Number.isFinite(deltaX)?deltaX:0,-4000,4000)*.005;
    this.yaw=Math.atan2(Math.sin(this.yaw),Math.cos(this.yaw));
    this.pitch=clamp(this.pitch+clamp(Number.isFinite(deltaY)?deltaY:0,-4000,4000)*.004,-.3,.8);
  }
  zoomBy(wheelDelta=0){
    this.zoom=clamp(this.zoom*Math.exp(clamp(Number.isFinite(wheelDelta)?wheelDelta:0,-2000,2000)*.001),.65,1.6);
  }
  reset(){this.yaw=0;this.pitch=0;this.zoom=1;}
}
