/** Adaptive resolution/shadows; no mission or save data is modified. */
export const GRAPHICS_TIERS=Object.freeze(['economy','balanced','quality']);
export const GRAPHICS_LABELS=Object.freeze({economy:'LEVE',balanced:'EQUILIBRADO',quality:'DETALHADO'});
export const GRAPHICS_CAPS=Object.freeze({economy:.72,balanced:1,quality:1.5});
export function pixelRatioFor(tier,deviceRatio=1){
  const ratio=Number.isFinite(deviceRatio)&&deviceRatio>0?deviceRatio:1;
  return Math.min(ratio,GRAPHICS_CAPS[tier]??GRAPHICS_CAPS.balanced);
}
export function suggestedTier({coarse=false,deviceMemory=0}={}){
  if(deviceMemory>0&&deviceMemory<=4)return 'economy';
  if(coarse||!deviceMemory)return 'balanced';
  return deviceMemory>=8?'quality':'balanced';
}
export function nextAdaptiveTier(tier,fps,slowSamples,fastSamples){
  const idx=Math.max(0,GRAPHICS_TIERS.indexOf(tier));
  if(Number.isFinite(fps)&&fps<29&&slowSamples>=3)return GRAPHICS_TIERS[Math.max(0,idx-1)];
  if(Number.isFinite(fps)&&fps>56&&fastSamples>=10)return GRAPHICS_TIERS[Math.min(GRAPHICS_TIERS.length-1,idx+1)];
  return tier;
}
export class GraphicsQuality {
  constructor(renderer,deviceRatio=1,coarse=false,memory=0,store=globalThis.localStorage){
    this.renderer=renderer;this.deviceRatio=deviceRatio;this.store=store;
    this.coarse=coarse;this.memory=memory;this.mode='auto';
    try{const saved=store?.getItem('asas-brumaria-graphics');if(['auto',...GRAPHICS_TIERS].includes(saved))this.mode=saved;}catch{}
    this.tier=this.mode==='auto'?suggestedTier({coarse,deviceMemory:memory}):this.mode;
    this.slowSamples=0;this.fastSamples=0;this.cooldown=0;
    this.apply();
  }
  apply(){
    this.renderer.setPixelRatio(pixelRatioFor(this.tier,this.deviceRatio));
    this.renderer.shadowMap.enabled=this.tier!=='economy';
    this.renderer.shadowMap.needsUpdate=true;
  }
  get label(){return `${this.mode==='auto'?'AUTO · ':''}${GRAPHICS_LABELS[this.tier]}`;}
  cycle(){
    const choices=['auto',...GRAPHICS_TIERS];
    this.mode=choices[(choices.indexOf(this.mode)+1)%choices.length];
    if(this.mode!=='auto')this.tier=this.mode;
    else this.tier=suggestedTier({coarse:this.coarse,deviceMemory:this.memory});
    this.slowSamples=0;this.fastSamples=0;this.cooldown=10;
    try{this.store?.setItem('asas-brumaria-graphics',this.mode);}catch{}
    this.apply();return this.label;
  }
  setDevice(coarse,memory){this.coarse=coarse;this.memory=memory;}
  sample(fps){
    if(this.mode!=='auto')return false;
    if(this.cooldown>0){this.cooldown--;return false;}
    if(fps<29){this.slowSamples++;this.fastSamples=0;}
    else if(fps>56){this.fastSamples++;this.slowSamples=0;}
    else{this.slowSamples=0;this.fastSamples=0;}
    let tier=nextAdaptiveTier(this.tier,fps,this.slowSamples,this.fastSamples);
    // Never auto-upgrade low-memory/coarse devices just because a light scene hit 60 FPS.
    if((this.coarse||this.memory>0&&this.memory<=4)&&tier==='quality')tier='balanced';
    if(tier===this.tier)return false;
    this.tier=tier;this.cooldown=12;this.slowSamples=0;this.fastSamples=0;
    this.apply();return true;
  }
  onResize(deviceRatio){this.deviceRatio=deviceRatio;this.apply();}
}
