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
  constructor(dragon,{fetcher=(...args)=>fetch(...args),load=installDragonGLB,clear=clearDragonGLB,base=import.meta.url,preferMobile=false,onStatus=()=>{}}={}){
    this.dragon=dragon;this.fetcher=fetcher;this.load=load;this.clear=clear;this.base=base;
    this.preferMobile=preferMobile;this.onStatus=onStatus;
    this.generation=0;this.lastSelected=null;this.ready=false;
    this.queue=Promise.resolve();this.previewQueue=Promise.resolve();
    this.previewEpoch=0;this.pending=new Map();this.local=new Map();this.manualOverrides=new Set();this.error=null;
    this.manifestPromise=null;
  }
  async manifest(){
    if(!this.manifestPromise){
      const url=new URL('../../assets/models/dragon-species.json',this.base);
      this.manifestPromise=this.fetcher(url,{cache:'reload'}).then(async response=>{
        if(!response.ok)return {};
        const obj=await response.json();
        return obj&&typeof obj==='object'&&obj.available===true?obj:{};
      }).catch(error=>{
        // A failed fetch must be observable and retryable; otherwise an empty
        // manifest is cached for the entire session even when the GLBs exist.
        console.warn('Falha ao buscar catálogo oficial de dragões:',url.href,error);
        this.manifestPromise=null;
        return {};
      });
    }
    return this.manifestPromise;
  }
  async read(id){
    const name=fileForSpecies(id);
    if(!name)return null;
    // A user-selected replacement takes priority, never a stale IndexedDB
    // version from a previous deployment.
    if(this.manualOverrides.has(id)&&this.local.has(id))return this.local.get(id);

    // A missing/stale catalogue cannot suppress known official models.
    // Once the GLBs exist in /assets/models, load them directly and verify
    // the response. The manifest only guides mobile preference.
    let manifest={};
    try{
      manifest=await this.manifest();
    }catch(error){
      console.warn('Catálogo de dragões indisponível; tentando o GLB oficial diretamente',error);
    }
    if(!manifest.available)console.info('Catálogo ausente; buscando GLB oficial diretamente:',id);
    if(!this.pending.has(id)){
      const get=async(file)=>{
        const url=new URL(file,this.base);
        const response=await this.fetcher(url,{cache:'reload'});
        if(!response.ok)throw Error(`GLB oficial ${id} indisponível (HTTP ${response.status}): ${url.pathname}`);
        const data=await response.arrayBuffer();
        if(!data?.byteLength)throw Error('GLB oficial vazio: '+file);
        return data;
      };
      const promise=(async()=>{
        // A mobile build is a performance optimization; either version of
        // the published dragon is valid even if the manifest is stale.
        const mobile=this.preferMobile&&manifest.mobile!==false?mobileFileForSpecies(id):null;
        if(mobile){
          try{return await get(mobile);}
          catch(error){console.warn('GLB mobile indisponível; usando original:',id,error);}
        }
        return get(name);
      })().catch(error=>{this.pending.delete(id);throw error;});
      this.pending.set(id,promise);
    }
    try{
      return await this.pending.get(id);
    }catch(error){
      // Offline recovery only. Never let a cached older model override a
      // working official Fury asset from the current deployment.
      if(this.local.has(id))return this.local.get(id);
      try{
        const cached=await loadSpeciesModel(id);
        if(cached){this.local.set(id,cached);return cached;}
      }catch{/* Safari private mode and restricted IndexedDB are supported. */}
      throw error;
    }
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
    const hadManualOverride=this.manualOverrides.has(id);
    this.local.set(id,raw);
    // The player's explicit manual selection must override the official GLB
    // before select(id) attempts its render, not only after successful parsing.
    this.manualOverrides.add(id);
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
      if(!hadManualOverride)this.manualOverrides.delete(id);
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
    this.onStatus({id,state:'loading',message:'Carregando '+(id==='furia_noite'?'Fúria da Noite':id==='furia_luz'?'Fúria da Luz':'dragão')+' em 3D…'});
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
        this.onStatus({id,state:'error',message:'Não foi possível baixar o dragão 3D: '+error.message});
        if(this.dragon.externalDragonModel?.species!==id)this.clear(this.dragon);
        return false;
      }
      if(gen!==this.generation)return false;
      if(!bytes){
        if(this.dragon.externalDragonModel)this.clear(this.dragon);
        this.onStatus({id,state:'missing',message:'GLB não disponível; usando dragão reserva.'});
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
        this.onStatus({id,state:'ok',message:(id==='furia_noite'?'Fúria da Noite':'Fúria da Luz')+' 3D carregada · 49 ossos · 8 animações'});
        this.error=null;return true;
      }catch(error){
        if(gen!==this.generation)return false;
        this.error=error;
        this.onStatus({id,state:'error',message:'Falha ao renderizar o dragão 3D: '+error.message});
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
        if(previewDragon.externalDragonModel){
          previewDragon.externalDragonModel.source='species';
          previewDragon.externalDragonModel.species=id;
        }
        return true;
      }catch{return false;}
    };
    this.previewQueue=this.previewQueue.catch(()=>{}).then(task);
    return this.previewQueue;
  }
}
