// Regras de contratos independentes do renderizador: testes e saves previsíveis.
export const CONTRACTS=Object.freeze({
  correio:{title:'CORREIO DOS CÉUS',npc:'iara',reward:2,requiresMount:true,
    description:'Entregue três mensagens nos faróis luminosos e volte para Iara.',
    points:[[103,35,43],[166,37,106],[-119,35,152]]},
  ervas:{title:'ERVAS DO REFÚGIO',npc:'lume',reward:1,requiresMount:false,
    description:'Encontre três plantas curativas a pé e volte para Lume.',
    points:[[36,0,22],[47,0,-15],[-45,0,15]]}
});
const safeStatus=value=>['idle','active','ready','done'].includes(value)?value:'idle';
export class VillageContracts {
  constructor(saved){
    this.state=Object.fromEntries(Object.keys(CONTRACTS).map(k=>[k,{status:'idle',collected:[false,false,false]}]));
    if(saved)this.restore(saved);
  }
  get active(){return Object.entries(this.state).filter(([,s])=>s.status==='active'||s.status==='ready');}
  snapshot(){return Object.fromEntries(Object.entries(this.state).map(([k,v])=>[k,{status:v.status,collected:[...v.collected]}]));}
  restore(saved){
    for(const key of Object.keys(CONTRACTS)){
      const value=saved?.[key]??{};
      const status=safeStatus(value.status);
      const collected=CONTRACTS[key].points.map((_,i)=>value.collected?.[i]===true);
      if(status==='ready'||status==='done')collected.fill(true);
      this.state[key]={status,collected};
    }
  }
  talk(npc){
    if(npc==='borin')return {npc,text:'O vento exige asas fortes. Abra o estábulo com T, evolua suas habilidades e tente o Circuito da Tempestade!',action:'stable'};
    const key=Object.keys(CONTRACTS).find(k=>CONTRACTS[k].npc===npc);
    if(!key)return null;
    const def=CONTRACTS[key],s=this.state[key];
    if(s.status==='idle'){
      s.status='active';return {npc,text:`${def.title}: ${def.description} Recompensa: ${def.reward} pontos de treino.`,action:'accepted',key};
    }
    if(s.status==='active')return {npc,text:`Ainda faltam ${s.collected.filter(x=>!x).length} objetivos. ${def.description}`,action:'reminder',key};
    if(s.status==='ready'){
      s.status='done';return {npc,text:`Excelente trabalho! ${def.title} concluído. Você ganhou ${def.reward} pontos de treinamento.`,action:'reward',key,reward:def.reward};
    }
    return {npc,text:'Brumária é mais segura quando cuidamos uns dos outros. Obrigado, cavaleiro!',action:'done',key};
  }
  collect(key,index,mounted){
    const s=this.state[key],def=CONTRACTS[key];
    if(!s||s.status!=='active'||s.collected[index]||!def.points[index]||def.requiresMount!==mounted)return false;
    s.collected[index]=true;
    if(s.collected.every(Boolean))s.status='ready';
    return true;
  }
}
