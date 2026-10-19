import {inspectGLB} from '../entities/glbValidation.js';
import {buildDragonDemoGLB} from '../entities/dragonDemoGlb.js';
import {installDragonGLB,clearDragonGLB} from '../entities/dragonAssetLoader.js';
import {loadSavedDragonGLB,saveDragonGLB,clearSavedDragonGLB} from '../entities/dragonAssetStore.js';

/** Dragon model is a visual-only, opt-in slot. Never rewrites normal saves. */
export class DragonAssetUI{
  constructor(dragon){
    this.dragon=dragon;this.busy=false;this.hasInteracted=false;
    this.status=document.getElementById('dragon-glb-status');
    this.input=document.getElementById('dragon-glb-file');
    this.buttons=['dragon-glb-import','dragon-glb-demo','dragon-glb-reset'].map(id=>document.getElementById(id));
    this.buttons[0].addEventListener('click',()=>this.input.click());
    this.input.addEventListener('change',()=>{
      const file=this.input.files?.[0];if(file)this.install(file);
      this.input.value='';
    });
    this.buttons[1].addEventListener('click',()=>this.install(new File([buildDragonDemoGLB()],'dragao-demo.glb',{type:'model/gltf-binary'}),{remember:false}));
    this.buttons[2].addEventListener('click',()=>this.reset());
    this.restoreSaved();
  }
  setStatus(message,mode='neutral'){
    this.status.textContent=message;this.status.dataset.state=mode;
  }
  lock(v){this.busy=v;this.buttons.forEach(b=>b.disabled=v);}
  async install(file,{remember=true,automatic=false}={}){
    if(!automatic)this.hasInteracted=true;
    if(this.busy)return false;
    this.lock(true);
    try{
      if(!file?.name?.toLowerCase().endsWith('.glb'))throw Error('Selecione um arquivo .glb convertido, não um ZIP nem um BLEND.');
      const bytes=await file.arrayBuffer(),info=inspectGLB(bytes);
      this.setStatus('Preparando dragão 3D e mapeando as animações…');
      const result=await installDragonGLB(this.dragon,bytes);
      const clips=result.clips.length?result.clips.join(', '):'nenhuma';
      const warnings=['fly','glide'].some(k=>result.mapped.includes(k))?'':' · Sem clipe de voo reconhecido (usando animação disponível)';
      this.setStatus(`✓ Dragão GLB ativo — ${info.meshCount} malhas · animações: ${clips}${warnings}.`,'ok');
      if(remember){
        try{await saveDragonGLB(file);}catch(e){this.setStatus('✓ Dragão ativo só nesta sessão: '+e.message,'warn');}
      }
      return true;
    }catch(error){
      this.setStatus('Modelo anterior preservado: '+String(error?.message??error),'error');
      console.warn('Dragão GLB opcional:',error);
      return false;
    }finally{this.lock(false);}
  }
  async restoreSaved(){
    try{
      const record=await loadSavedDragonGLB();
      if(!record||this.hasInteracted||this.busy)return;
      await this.install(new File([record.blob],record.name||'dragao.glb',{type:'model/gltf-binary'}),{remember:false,automatic:true});
    }catch(error){this.setStatus('Use um GLB para testar um dragão externo; o dragão original continua disponível.','neutral');}
  }
  async reset(){
    this.hasInteracted=true;if(this.busy)return;
    this.lock(true);
    try{
      clearDragonGLB(this.dragon);
      await clearSavedDragonGLB();
      this.setStatus('Dragão original restaurado, com todas as suas animações.','ok');
    }catch(error){this.setStatus('Dragão original restaurado, mas o arquivo local pode continuar salvo: '+error.message,'warn');}
    finally{this.lock(false);}
  }
}
