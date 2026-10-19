/** Pure, deterministic secondary animation poses; no WebGL or save dependencies. */
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const safe=(n,fallback=0)=>Number.isFinite(n)?n:fallback;

export function hatchlingPose(time=0,index=0,carried=false){
  const t=safe(time),phase=safe(index)*1.7;
  const idle=Math.sin(t*2.3+phase);
  const blink=Math.pow(Math.max(0,Math.sin(t*.71+phase+1.2)),42);
  return {
    breath:1+idle*.027,
    headPitch:(carried?.06:-.035)+Math.sin(t*1.52+phase)*.075,
    headRoll:Math.sin(t*.91+phase)*.075,
    tailYaw:Math.sin(t*2.1+phase)*.25,
    wingFlap:Math.sin(t*(carried?9.2:5.8)+phase)*(carried?.28:.17),
    eyeOpen:clamp(1-blink*.93,.09,1)
  };
}

export function wildDragonPose({time=0,phase=0,mood='distante',near=false,petTime=0}={}){
  const t=safe(time),p=safe(phase),reaction=clamp(safe(petTime)/1.25,0,1);
  const calm=mood==='tranquilo',startled=mood==='assustado';
  const blink=Math.pow(Math.max(0,Math.sin(t*.85+p+1.5)),48);
  return {
    affection:reaction,
    breath:1+Math.sin(t*1.7+p)*.022,
    headPitch:Math.sin(t*1.35+p)*.047+(startled?.19:near?-.075:0)-reaction*.22,
    headRoll:Math.sin(t*.68+p)*.048+reaction*.10,
    tailYaw:Math.sin(t*(reaction>0?3.8:1.45)+p)*(.17+reaction*.30),
    tailPitch:Math.sin(t*2+p)*.038+reaction*.07,
    ears:calm?-.13: startleEars(startled,reaction),
    eyeOpen:clamp(1-blink*.93-reaction*.59,.10,1),
    jawOpen:calm?-.14-reaction*.05:0,
    wingsRelax:reaction*.12
  };
}
function startleEars(startled,reaction){return startled?.19:-reaction*.25;}
