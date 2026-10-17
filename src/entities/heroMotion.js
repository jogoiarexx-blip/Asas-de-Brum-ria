/** Movement/animation math shared by procedural hero and future GLB rigs. */
export function walkIntent(x=0,z=0){
  const magnitude=Math.hypot(x,z);
  if(!Number.isFinite(magnitude)||magnitude<.001)return {x:0,z:0,strength:0};
  const m=Math.min(magnitude,1),scale=m/magnitude;
  return {x:x*scale,z:z*scale,strength:m};
}
export function poseForHero(t=0,intensity=0,mounted=false,running=false){
  if(mounted)return {stride:0,sway:0,knee:.86,arm:-.83,cape:.3,bodyLean:.08};
  const speed=Math.min(1,Math.max(0,intensity));
  const wave=Math.sin(t),side=Math.cos(t);
  const amp=(running?.72:.48)*speed;
  return {stride:wave*amp,sway:side*.075*speed,knee:Math.max(0,-wave)*amp*.6,
    arm:-wave*amp*.8,cape:.13+speed*(running?.28:.13),bodyLean:speed*(running?.11:.035)};
}
