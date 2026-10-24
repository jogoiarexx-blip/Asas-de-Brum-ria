/** Mobile visual budget — does not change the dragon mesh, rig or gameplay. */
export function preferMobileDragonAssets({memory=0,coarse=false,saveData=false}={}){
  return saveData===true||(Number.isFinite(memory)&&memory>0&&memory<=4)||coarse===true;
}
export function maxDragonTextureSize({memory=0,coarse=false,saveData=false}={}){
  if(saveData||(Number.isFinite(memory)&&memory>0&&memory<=2))return 512;
  return preferMobileDragonAssets({memory,coarse,saveData})?1024:Infinity;
}
export function browserDragonBudget(){
  const nav=typeof navigator==='undefined'?null:navigator;
  let coarse=false;
  try{coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch{}
  return {memory:Number(nav?.deviceMemory)||0,coarse,saveData:nav?.connection?.saveData===true};
}
export function downsizeDragonTextures(scene,maxSize,{canvasFactory}={}){
  if(!Number.isFinite(maxSize)||maxSize<=0||!scene)return {resized:0,skipped:0};
  const create=canvasFactory??((w,h)=>{
    if(typeof document==='undefined')return null;
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;
  });
  const textures=new Set();
  scene.traverse(object=>{
    if(!object.isMesh)return;
    for(const mat of Array.isArray(object.material)?object.material:[object.material]){
      if(!mat)continue;
      for(const value of Object.values(mat))if(value?.isTexture)textures.add(value);
    }
  });
  let resized=0,skipped=0;
  for(const texture of textures){
    const image=texture.image;
    const w=image?.width??0,h=image?.height??0;
    if(texture.isCompressedTexture||!w||!h||Math.max(w,h)<=maxSize){skipped++;continue;}
    try{
      const ratio=Math.min(1,maxSize/Math.max(w,h)),width=Math.max(1,Math.round(w*ratio)),
        height=Math.max(1,Math.round(h*ratio));
      const canvas=create(width,height);
      const ctx=canvas?.getContext?.('2d',{alpha:true});
      if(!ctx){skipped++;continue;}
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(image,0,0,width,height);
      texture.image=canvas;
      texture.needsUpdate=true;
      resized++;
    }catch{
      // Browsers with disabled Canvas 2D, unsupported ImageBitmap types or
      // WebGL context loss keep the original texture without losing gameplay.
      skipped++;
    }
  }
  return {resized,skipped};
}
