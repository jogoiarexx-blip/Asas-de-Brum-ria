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
export class SpeciesDragonModels{
  constructor(dragon,{fetcher=fetch,load=installDragonGLB,clear=clearDragonGLB,base=import.meta.url}={}){
    this.dragon=dragon;this.fetcher=fetcher;this.load=load;this.clear=clear;this.base=base;
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
      const url=new URL(name,this.base);
      const promise=this.fetcher(url,{cache:'force-cache'}).then(async response=>{
        if(!response.ok)throw Error(`Modelo ${id} indisponível (HTTP ${response.status})`);
        return response.arrayBuffer();
      }).catch(err=>{this.pending.delete(id);throw err;});
      this.pending.set(id,promise);
    }
    return this.pending.get(id);
  }
  async installUploaded(id,bytes){
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
    this.local.set(id,raw);
    this.pending.delete(id);
    let saved=true;
    try{await saveSpeciesModel(id,raw);}catch{saved=false;}
    const loaded=this.lastSelected===id?await this.select(id):false;
    return {info,saved,loaded};
  }
  /** Safe with quick species changes: parsing/scene swaps are serialized. */
  select(id){
    const gen=++this.generation;
    this.lastSelected=id;
    const task=async()=>{
      if(gen!==this.generation)return false;
      const prev=this.dragon.externalDragonModel;
      if(prev)this.clear(this.dragon);
      const name=fileForSpecies(id);
      if(!name){this.error=null;return false;}
      let bytes;
      try{bytes=await this.read(id);}catch(error){this.error=error;return false;}
      if(gen!==this.generation||!bytes)return false;
      try{
        await this.load(this.dragon,bytes);
        if(gen!==this.generation){
          this.clear(this.dragon);
          return false;
        }
        if(this.dragon.externalDragonModel)this.dragon.externalDragonModel.source='species';
        this.error=null;return true;
      }catch(error){
        this.error=error;
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
