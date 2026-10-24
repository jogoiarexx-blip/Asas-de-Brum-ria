import {installDragonGLB,clearDragonGLB} from './dragonAssetLoader.js';
import {inspectGLB} from './glbValidation.js';
import {loadSpeciesModel,saveSpeciesModel} from './speciesModelStore.js';

/** Species are locked/unlocked by Progression, never by their visual assets.
 * Assets are optional so Pages/offline never lose gameplay when GLBs are missing. */
export const SPECIES_MODEL_FILES=Object.freeze({
  furia_noite:'../../assets/models/furia-da-noite.glb',
  furia_luz:'../../assets/models/furia-da-luz.glb'
});
export function fileForSpecies(id){return SPECIES_MODEL_FILES[id]??null;}
export function mobileFileForSpecies(id){
  return id==='furia_noite'?'../../assets/models/furia-da-noite-mobile.glb':
    id==='furia_luz'?'../../assets/models/furia-da-luz-mobile.glb':null;
}
export class SpeciesDragonModels{
  constructor(dragon,{fetcher=fetch,load=installDragonGLB,clear=clearDragonGLB,base=import.meta.url,preferMobile=false}={}){
    this.dragon=dragon;this.fetcher=fetcher;this.load=load;this.clear=clear;this.base=base;
    this.preferMobile=preferMobile;
    this.generation=0;this.lastSelected=null;this.ready=false;
    this.queue=Promise.resolve();this.previewQueue=Promise.resolve();
    this.previewEpoch=0;this.pending=new Map();this.local=new Map();this.error=null;
    this.manifestPromise=null;
  }
  async manifest(){
    if(!this.manifestPromise){
      const url=new URL('../../assets/models/dragon-species.json',this.base);
      this.manifestPromise=this.fetcher(url,{cache:'no-cache'}).then(async response=>{
        if(!response.ok)return {};
        const obj=await response.json();
        return obj&&typeof obj==='object'&&obj.available===true?obj:{};
      }).catch(()=>({}));
    }
    return this.manifestPromise;
  }
  async read(id){
    const name=fileForSpecies(id);
    if(!name)return null;
    if(this.local.has(id))return this.local.get(id);
    try{
      const cached=await loadSpeciesModel(id);
      if(cached){this.local.set(id,cached);return cached;}
    }catch{/* IndexedDB may be disabled, use bundled GLB or procedural fallback. */}
    const manifest=await this.manifest();
    if(!manifest.available||!Array.isArray(manifest.species)||!manifest.species.includes(id))return null;
    if(!this.pending.has(id)){
      const get=async(file)=>{
        const url=new URL(file,this.base);
        const response=await this.fetcher(url,{cache:'force-cache'});
        if(!response.ok)throw Error(`Modelo ${id} indisponível (HTTP ${response.status})`);
        return response.arrayBuffer();
      };
      const promise=(async()=>{
        const mobile=this.preferMobile&&manifest.mobile===true?mobileFileForSpecies(id):null;
        if(mobile){
          try{return await get(mobile);}
          catch(error){console.warn('GLB mobile indisponível, usando versão completa:',id,error);}
        }
        return get(name);
      })().catch(error=>{this.pending.delete(id);throw error;});
      this.pending.set(id,promise);
    }
    return this.pending.get(id);
  }
  async installUploaded(id,bytes,{previewDragon=null}={}){
    if(!fileForSpecies(id))throw Error('Modelo destinado a uma espécie desconhecida.');
    const raw=bytes instanceof ArrayBuffer?bytes:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
    const info=inspectGLB(raw);
    const header=new DataView(raw);
    const length=header.getUint32(12,true);
    const json=JSON.parse(new TextDecoder().decode(new Uint8Array(raw,20,length)));
    if(info.animationCount!==8||!json.skins?.some(skin=>skin.joints?.length===49))
      throw Error('Use o GLB do pacote fornecido, com 49 ossos e 8 animações.');
    const names=new Set(json.animations.map(animation=>animation.name));
    for(const clip of ['Idle','Walk','Fly','Glide','Attack','Hurt','Takeoff','Landing']){
      if(!names.has(clip))throw Error('Animação ausente no GLB: '+clip);
    }
    // Stage in RAM; IndexedDB is only written AFTER a successful render.
    const hadPrevious=this.local.has(id),previous=this.local.get(id);
    this.local.set(id,raw);
    this.pending.delete(id);
    const isSelected=this.lastSelected===id;
    let loaded=false,previewed=false;
    try{
      if(isSelected){
        loaded=await this.select(id);
        if(!loaded&&this.lastSelected===id)
          throw this.error??Error('O dragão foi validado, mas não pôde ser renderizado.');
      }else{
        // A locked species must never be mounted just to validate its asset.
        // Parse it on the separate preview rig BEFORE persisting to IndexedDB.
        if(!previewDragon)throw Error('Abra a prévia 3D para testar este modelo antes de salvá-lo.');
        await this.load(previewDragon,raw);
        if(previewDragon.externalDragonModel){
          previewDragon.externalDragonModel.source='species';
          previewDragon.externalDragonModel.species=id;
        }
        previewed=true;
      }
    }catch(error){
      if(hadPrevious)this.local.set(id,previous);
      else this.local.delete(id);
      throw error;
    }
    let saved=true;
    try{await saveSpeciesModel(id,raw);}catch{saved=false;}
    return {info,saved,loaded,previewed};
  }
  /** Safe with quick species changes: parsing/scene swaps are serialized. */
  select(id){
    const gen=++this.generation;
    this.lastSelected=id;
    const task=async()=>{
      if(gen!==this.generation)return false;
      const name=fileForSpecies(id);
      if(!name){
        if(this.dragon.externalDragonModel)this.clear(this.dragon);
        this.error=null;return false;
      }
      let bytes;
      try{bytes=await this.read(id);}catch(error){
        if(gen!==this.generation)return false;
        this.error=error;
        if(this.dragon.externalDragonModel?.species!==id)this.clear(this.dragon);
        return false;
      }
      if(gen!==this.generation)return false;
      if(!bytes){
        if(this.dragon.externalDragonModel)this.clear(this.dragon);
        this.error=null;return false;
      }
      try{
        // Keep the previous GLB alive throughout fetching and parsing. The
        // loader commits the swap only after the new scene is ready.
        await this.load(this.dragon,bytes);
        if(gen!==this.generation)return false;
        if(this.dragon.externalDragonModel){
          this.dragon.externalDragonModel.source='species';
          this.dragon.externalDragonModel.species=id;
        }
        this.error=null;return true;
      }catch(error){
        if(gen!==this.generation)return false;
        this.error=error;
        // Do not display a model from another species after a failed load.
        const current=this.dragon.externalDragonModel;
        if(current&&current.species!==id)this.clear(this.dragon);
        return false;
      }
    };
    this.queue=this.queue.catch(()=>{}).then(task);
    return this.queue;
  }
  preview(previewDragon,id){
    // Serializes imports so rapidly clicking species can't display the wrong GLB.
    const generation=++this.previewEpoch;
    const task=async()=>{
      const bytes=await this.read(id).catch(()=>null);
      if(generation!==this.previewEpoch)return false;
      if(!bytes)return false; // procedural StablePreview remains the fallback
      try{
        await this.load(previewDragon,bytes);
        if(generation!==this.previewEpoch){this.clear(previewDragon);return false;}
        if(previewDragon.externalDragonModel)previewDragon.externalDragonModel.source='species';
        return true;
      }catch{return false;}
    };
    this.previewQueue=this.previewQueue.catch(()=>{}).then(task);
    return this.previewQueue;
  }
}
