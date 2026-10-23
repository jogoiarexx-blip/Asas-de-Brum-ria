import {installDragonGLB,clearDragonGLB} from './dragonAssetLoader.js';

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
    this.queue=Promise.resolve();this.pending=new Map();this.error=null;
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
  /** Safe with quick species changes: parsing/scene swaps are serialized. */
  select(id){
    const gen=++this.generation;
    this.lastSelected=id;
    const task=async()=>{
      if(gen!==this.generation)return false;
      const prev=this.dragon.externalDragonModel;
      if(prev&&prev.source!=='species')this.clear(this.dragon);
      else if(prev)this.clear(this.dragon);
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
  async preview(previewDragon,id){
    // Preview is only for species available to view, not an unlock shortcut.
    const bytes=await this.read(id).catch(()=>null);
    if(!bytes)return false;
    try{
      await this.load(previewDragon,bytes);
      if(previewDragon.externalDragonModel)previewDragon.externalDragonModel.source='species';
      return true;
    }catch{return false;}
  }
}
