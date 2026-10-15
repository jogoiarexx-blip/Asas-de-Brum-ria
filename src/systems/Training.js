import * as THREE from 'three';
import {CIRCUITS} from './TrainingConfig.js';
export {CIRCUITS} from './TrainingConfig.js';
export class Training {
  constructor(scene,onUpdate,onSuccess){
    this.onUpdate=onUpdate;this.onSuccess=onSuccess;this.active=false;this.mode='basic';this.progress=0;
    this.seconds=0;this.cooldown=0;this.rings=[];
    for(const [id,def] of Object.entries(CIRCUITS)){
      for(const [index,[x,y,z]] of def.checkpoints.entries()){
        const group=new THREE.Group();group.position.set(x,y,z);
        const gold=new THREE.MeshBasicMaterial({color:id==='basic'?0xffdc87:0xff88d5,side:THREE.DoubleSide});
        group.add(new THREE.Mesh(new THREE.TorusGeometry(id==='basic'?5.3:6.4,.38,9,36),gold));
        const halo=new THREE.Mesh(new THREE.TorusGeometry(id==='basic'?6.3:7.3,.12,7,36),new THREE.MeshBasicMaterial({color:0x8bfed7}));group.add(halo);
        group.visible=false;this.rings.push({id,index,group});scene.add(group);
      }
    }
  }
  get definition(){return CIRCUITS[this.mode];}
  get waypoint(){return this.active?this.rings.find(r=>r.id===this.mode&&r.index===this.progress)?.group.position??null:null;}
  refresh(){this.rings.forEach(r=>r.group.visible=this.active&&r.id===this.mode&&r.index===this.progress);this.onUpdate?.();}
  start(mode='basic'){
    if(!CIRCUITS[mode])return {ok:false,reason:'Circuito desconhecido.'};
    if(this.active)return {ok:false,reason:'Circuito já iniciado.'};
    if(this.cooldown>0)return {ok:false,reason:`Aguarde ${Math.ceil(this.cooldown)} s para outro circuito.`};
    this.active=true;this.mode=mode;this.progress=0;this.seconds=CIRCUITS[mode].seconds;this.refresh();return {ok:true};
  }
  cancel(){this.active=false;this.refresh();}
  update(dt,time,dragon){
    this.cooldown=Math.max(0,this.cooldown-dt);
    if(!this.active)return null;
    this.seconds-=dt;
    if(this.seconds<=0){this.seconds=0;this.cancel();return 'Treino encerrado: o tempo terminou.';}
    const ring=this.rings.find(r=>r.id===this.mode&&r.index===this.progress)?.group;
    if(ring){ring.rotation.z+=dt*.26;ring.scale.setScalar(1+Math.sin(time*3)*.025);}
    if(dragon.riding&&ring&&dragon.group.position.distanceTo(ring.position)<(this.mode==='basic'?8.1:9.5)){
      if(dragon.speed<this.definition.minSpeed)return `Aumente a velocidade! Precisa de ${this.definition.minSpeed} m/s neste circuito.`;
      this.progress++;
      if(this.progress===this.definition.checkpoints.length){
        const mode=this.mode,reward=this.definition.reward;
        this.active=false;this.cooldown=25;this.refresh();this.onSuccess?.(mode,reward);
        return `${this.definition.label} concluído! +${reward} ponto(s) de treino.`;
      }
      this.refresh();return `Checkpoint ${this.progress} de ${this.definition.checkpoints.length}!`;
    }
    return null;
  }
}
