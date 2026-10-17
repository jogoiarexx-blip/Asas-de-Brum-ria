import * as THREE from 'three';
/** Only loaded when the game owner explicitly configures a local model. The
 * procedural character remains intact as a fallback if download/rig fails. */
export async function loadOptionalHeroGLB(hero,url,{yaw=0,onError=console.warn}={}){
  if(!url)return false;
  try{
    const addon=`https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js`;
    const {GLTFLoader}=await import(addon);
    const asset=await new GLTFLoader().loadAsync(url);
    const model=asset.scene;
    const bounds=new THREE.Box3().setFromObject(model);
    const height=bounds.max.y-bounds.min.y;
    if(!Number.isFinite(height)||height<=.01)throw new Error('Modelo GLB sem dimensões válidas');
    const scale=2.23/height;
    model.scale.setScalar(scale);
    model.position.set(-(bounds.min.x+bounds.max.x)*scale*.5,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*scale*.5);
    model.rotation.y=yaw;
    model.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
    hero.group.add(model);
    hero.group.userData.body.visible=false;
    hero.externalModel=model;
    const clips=asset.animations??[];
    if(clips.length){
      hero.externalMixer=new THREE.AnimationMixer(model);
      hero.externalClips={};
      for(const clip of clips){const key=clip.name.toLowerCase();
        if(/idle|walk|run/.test(key))hero.externalClips[key.match(/idle|walk|run/)[0]]=hero.externalMixer.clipAction(clip);
      }
      hero.externalAction=hero.externalClips.idle??Object.values(hero.externalClips)[0]??null;
      hero.externalAction?.play();
    }
    return true;
  }catch(error){onError('Modelo GLB opcional indisponível; personagem original preservado:',error);return false;}
}
export function updateOptionalHeroGLB(hero,dt){
  if(!hero.externalMixer)return;
  const next=hero.moveSpeed>.12?(hero.moveSpeed>5.5?hero.externalClips?.run??hero.externalClips?.walk:hero.externalClips?.walk)??hero.externalClips?.idle:hero.externalClips?.idle;
  if(next&&next!==hero.externalAction){next.reset().fadeIn(.16).play();hero.externalAction?.fadeOut(.16);hero.externalAction=next;}
  hero.externalMixer.update(dt);
}
