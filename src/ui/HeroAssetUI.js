import {HERO_GLB_URL,HERO_ASSET_PUBLISHED,HERO_MODEL_FACING_YAW} from '../entities/heroAssetConfig.js';
import {installHeroGLB,clearHeroGLB} from '../entities/heroAssetLoader.js';
import {loadSavedHeroGLB,saveHeroGLB,clearSavedHeroGLB} from '../entities/heroAssetStore.js';
import {inspectGLB} from '../entities/glbValidation.js';
import {buildDemoGLB} from '../entities/demoGlb.js';

export class HeroAssetUI {
 constructor(hero){
   this.hero=hero;this.busy=false;this.hasInteracted=false;
   this.status=document.getElementById('hero-glb-status');
   this.input=document.getElementById('hero-glb-file');
   this.buttons=['hero-glb-import','hero-glb-demo','hero-glb-reset'].map(id=>document.getElementById(id));
   this.buttons[0].addEventListener('click',()=>this.input.click());
   this.input.addEventListener('change',()=>{
     const file=this.input.files?.[0];if(file)this.install(file);
     this.input.value='';
   });
   this.buttons[1].addEventListener('click',()=>this.installDemo());
   this.buttons[2].addEventListener('click',()=>this.reset());
   this.loadSavedHeroGLB();
 }
 setStatus(message,mode='neutral'){
   if(!this.status)return;
   this.status.textContent=message;this.status.dataset.state=mode;
 }
 lock(state){this.busy=state;this.buttons.forEach(btn=>btn.disabled=state);}
 async install(file,{remember=true,automatic=false}={}){
   if(!automatic)this.hasInteracted=true;
   if(this.busy)return false;
   this.lock(true);
   try{
     if(!file?.name?.toLowerCase().endsWith('.glb'))throw new Error('Escolha um arquivo .glb (glTF Binary).');
     this.setStatus(`Validando ${file.name}…`);
     const bytes=await file.arrayBuffer();
     const info=inspectGLB(bytes);
     this.setStatus('Importando geometria e animações…');
     await installHeroGLB(this.hero,bytes,{yaw:HERO_MODEL_FACING_YAW,onStatus:message=>this.setStatus(message)});
     const animations=info.animationCount?`${info.animationCount} animações originais`:'rig adaptado';
     const riderCount=this.hero.externalHeroInfo?.mappedRiding?.length??0;
     this.setStatus(`✓ ${file.name}: personagem substituído a pé e no dragão · ${animations} · ${riderCount} movimentos de montaria.`,'ok');
     if(remember){
       try{await saveHeroGLB(file);}catch(error){this.setStatus(`✓ Modelo aplicado nesta sessão. Não foi possível salvá-lo no navegador: ${error.message}`,'warn');}
     }
     return true;
   }catch(error){
     this.setStatus(`Erro ao importar: ${error.message||String(error)}. O personagem anterior foi preservado.`,'error');
     console.error('GLB:',error);return false;
   }finally{this.lock(false);}
 }
 async installDemo(){
   if(this.busy)return;
   try{
     this.setStatus('Carregando modelo de demonstração…');
     const bytes=buildDemoGLB();
     await this.install(new File([bytes],'hero-demo.glb',{type:'model/gltf-binary'}));
   }catch(error){this.setStatus(`Erro na demonstração: ${error.message}`,'error');}
 }
 async loadSavedHeroGLB(){
   // The official new hero wins over demo/legacy cached characters. If its
   // binary is absent on a Pages deployment, retain browser-import fallback.
   if(HERO_ASSET_PUBLISHED&&HERO_GLB_URL){
     try{
       const url=new URL(HERO_GLB_URL,document.baseURI);
       const response=await fetch(url,{cache:'no-cache'});
       if(response.ok&&!this.hasInteracted&&!this.busy){
         const data=await response.arrayBuffer();
         if(data.byteLength>1024){
           const imported=await this.install(new File([data],'personagem_animado_montaria.glb',
             {type:'model/gltf-binary'}),{remember:false,automatic:true});
           if(imported)return;
         }
       }
     }catch(error){
       console.info('GLB oficial do cavaleiro não publicado; importação local disponível:',error.message);
     }
   }
   try{
     const record=await loadSavedHeroGLB();
     if(this.hasInteracted||this.busy)return;
     if(!record)return;
     await this.install(new File([record.blob],record.name||'personagem.glb',
       {type:'model/gltf-binary'}),{remember:false,automatic:true});
   }catch(error){
     console.warn('GLB anterior não restaurado:',error);
     this.setStatus('Importe o novo personagem no estábulo. As animações de montaria serão adicionadas automaticamente.','neutral');
   }
 }
 async reset(){
   this.hasInteracted=true;
   if(this.busy)return;
   this.lock(true);
   try{clearHeroGLB(this.hero);await clearSavedHeroGLB();this.setStatus('Personagem original restaurado. Modelo salvo apagado.','ok');}
   catch(error){this.setStatus(`Personagem original restaurado, mas houve erro no armazenamento: ${error.message}`,'warn');}
   finally{this.lock(false);}
 }
}
