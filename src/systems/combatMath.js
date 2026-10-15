/** Funções numéricas independentes de WebGL para permitir testes de combate. */
export function shortestAngle(delta) {
  return Math.atan2(Math.sin(delta), Math.cos(delta));
}
export function segmentPointDistanceSquared(a,b,p) {
  const abx=b.x-a.x,aby=b.y-a.y,abz=b.z-a.z;
  const lengthSquared=abx*abx+aby*aby+abz*abz;
  const t=lengthSquared>1e-9?Math.max(0,Math.min(1,((p.x-a.x)*abx+(p.y-a.y)*aby+(p.z-a.z)*abz)/lengthSquared)):0;
  const dx=a.x+abx*t-p.x,dy=a.y+aby*t-p.y,dz=a.z+abz*t-p.z;
  return dx*dx+dy*dy+dz*dz;
}
export function segmentSphereHit(a,b,center,radius) {
  return segmentPointDistanceSquared(a,b,center)<=radius*radius;
}
export function pursuitYaw(from,to) {
  return Math.atan2(-(to.x-from.x),-(to.z-from.z));
}
export function limitedTurn(from,to,maxTurn) {
  return from+Math.max(-maxTurn,Math.min(maxTurn,shortestAngle(to-from)));
}
