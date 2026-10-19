import * as THREE from 'three';
import {inspectGLB} from './glbValidation.js';
import {mapDragonClips,dragonAnimationState,selectDragonClip} from './dragonClipMap.js';

const VERSION='0.180.0';
const mirrors=[`https://cdn.jsdelivr.net/npm/three@${VERSION}/examples/jsm/loaders/GLTFLoader.js`,
  `https://unpkg.com/three@${VERSION}/examples/jsm/loaders/GLTFLoader.js`];
let promise=null;
async function getGLTFLoader(){
  if(!promise){
    const urls=[new URL('../../vendor/addons/loaders/GLTFLoader.js',import.meta.url).href,...mirrors];
    promise=(async()=>{
      let error;
      for(const path of urls){try{
        const mod=await import(/* @vite-ignore */ path);
        if(mod.GLTFLoader)return mod.GLTFLoader;
      }catch(e){error=e;}}
      throw new Error('GLTFLoader indisponível. Use o inicializador com internet na primeira execução. '+String(error?.message??''));
    })();
  }
  try{return await promise;}catch(e){promise=null;throw e;}
}
function disposeRoot(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(obj=>{
    if(!obj.isMesh)return;
    if(obj.geometry)geometries.add(obj.geometry);
    for(const mat of Array.isArray(obj.material)?obj.material:[obj.material]){
      if(!mat)continue;
      materials.add(mat);
      for(const x of Object.values(mat))if(x?.isTexture)textures.add(x);
    }
  });
  root.parent?.remove(root);
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
  for(const t of textures)t.dispose();
}

/** Called only after parse and validation complete so bad uploads never
 * erase the current appearance or interfere with rider and flight physics. */
export async function installDragonGLB(dragon,bytes){
  const info=inspectGLB(bytes);
  const raw=bytes instanceof ArrayBuffer?bytes:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  const GLTFLoader=await getGLTFLoader();
  const gltf=await new GLTFLoader().parseAsync(raw,'');
  if(!gltf?.scene)throw new Error('O GLB não possui uma cena 3D.');
  let root=null;
  try{
    gltf.scene.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(gltf.scene);
    const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
    if(!Number.isFinite(size.length())||size.y<.01||Math.max(size.x,size.y,size.z)>1e7)
      throw new Error('Dimensões inválidas ou modelo sem altura.');
    const scale=Math.min(4.1/size.y,6/Math.max(size.x,.01),9/Math.max(size.z,.01));
    if(!Number.isFinite(scale)||scale<=0)throw new Error('Escala GLB inválida.');
    root=new THREE.Group();root.name='ExternalDragonGLB';
    const alignment=new THREE.Group();alignment.scale.setScalar(scale);
    alignment.position.copy(center).multiplyScalar(-scale);
    root.add(alignment);alignment.add(gltf.scene);
    const mixer=new THREE.AnimationMixer(gltf.scene);
    const slots=mapDragonClips(gltf.animations??[]);
    const animations={};
    for(const [key,clip] of Object.entries(slots))animations[key]=mixer.clipAction(clip);
    // Keep the old meshes until a valid replacement is ready.
    const current=dragon.externalDragonModel;
    const original=current?.original??dragon.visual.children
      .filter(obj=>obj!==dragon.rider)
      .map(obj=>({obj,visible:obj.visible}));
    root.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=false;}});
    dragon.visual.add(root);
    if(current){
      current.mixer.stopAllAction();
      disposeRoot(current.root);
    }
    dragon.externalDragonModel={root,mixer,slots,animations,active:null,original,scale};
    for(const {obj} of original)obj.visible=false;
    updateDragonGLB(dragon,0);
    return {...info,clips:(gltf.animations??[]).map(x=>x.name),mapped:Object.keys(slots),scale};
  }catch(error){
    if(root)disposeRoot(root);
    else disposeRoot(gltf.scene);
    throw error;
  }
}
export function clearDragonGLB(dragon){
  const data=dragon.externalDragonModel;
  if(!data)return;
  dragon.externalDragonModel=null;
  data.mixer.stopAllAction();
  for(const {obj,visible} of data.original)obj.visible=visible;
  disposeRoot(data.root);
  if(dragon.speciesPreset)dragon.setSpecies(dragon.speciesId,dragon.speciesPreset);
}
export function updateDragonGLB(dragon,dt=0){
  const data=dragon.externalDragonModel;
  if(!data)return;
  const state=dragonAnimationState(dragon);
  const clip=selectDragonClip(data.slots,state);
  const next=clip?data.mixer.clipAction(clip):null;
  if(next&&next!==data.active){
    next.reset().fadeIn(.18).play();
    if(data.active)data.active.fadeOut(.18);
    data.active=next;
  }
  if(Number.isFinite(dt)&&dt>0)data.mixer.update(Math.min(dt,.12));
}
