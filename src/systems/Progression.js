// Regras puras: podem ser testadas sem Three.js, DOM ou localStorage.
export const SPECIES = Object.freeze({
  nimbo: {name:'Nimbo',kind:'Asa da Névoa',price:0,description:'Equilibrado e confiável.',colors:[0x172e3c,0x254858,0x397c7b,0x236978,0x328b94,0x83c2ae],speed:1,stamina:1,fire:1},
  brasa: {name:'Brasa',kind:'Fúria Rubra',price:2,description:'Especialista em sopro de fogo.',colors:[0x422429,0x923c32,0xc57c44,0xa64232,0xd46a39,0xf5bc74],speed:.93,stamina:.93,fire:1.5},
  raio: {name:'Raio',kind:'Vento Celeste',price:3,description:'Veloz e resistente no voo.',colors:[0x202b5c,0x3554a8,0x6b92d7,0x5072c9,0x8ca6ee,0xc2e8ff],speed:1.22,stamina:1.18,fire:.85}
});
export const SKILLS = Object.freeze({
  speed:{name:'Asas fortes',max:3},stamina:{name:'Fôlego',max:3},fire:{name:'Sopro poderoso',max:3}
});
export const REWARDS=[1,1,1,2,2,2,2];
const int=(value,min,max,fallback=min)=>Number.isInteger(value)?Math.min(max,Math.max(min,value)):fallback;
export class Progression {
  constructor(saved=null){
    this.points=0;this.earned=0;this.species='nimbo';this.unlocked=['nimbo'];this.skills={speed:0,stamina:0,fire:0};this.circuits=0;
    if(saved)this.restore(saved);
  }
  restore(data){
    if(!data||typeof data!=='object')return;
    this.points=int(data.points,0,9999);this.earned=int(data.earned,0,9999);
    this.unlocked=['nimbo',...Object.keys(SPECIES).filter(id=>id!=='nimbo'&&Array.isArray(data.unlocked)&&data.unlocked.includes(id))];
    this.species=this.unlocked.includes(data.species)?data.species:'nimbo';
    for(const key of Object.keys(SKILLS))this.skills[key]=int(data.skills?.[key],0,SKILLS[key].max);
    this.circuits=int(data.circuits,0,9999);
    this.earned=Math.max(this.earned,this.points);
  }
  snapshot(){return {points:this.points,earned:this.earned,species:this.species,unlocked:[...this.unlocked],skills:{...this.skills},circuits:this.circuits};}
  grant(amount){const n=int(amount,0,100);this.points+=n;this.earned+=n;return n;}
  upgrade(key){
    if(!SKILLS[key])return {ok:false,reason:'Habilidade desconhecida.'};
    const level=this.skills[key],cost=level+1;
    if(level>=SKILLS[key].max)return {ok:false,reason:'Esta habilidade já está no nível máximo.'};
    if(this.points<cost)return {ok:false,reason:`São necessários ${cost} pontos de treino.`};
    this.points-=cost;this.skills[key]++;return {ok:true,cost};
  }
  unlock(id){
    const spec=SPECIES[id];if(!spec)return {ok:false,reason:'Espécie desconhecida.'};
    if(this.unlocked.includes(id))return {ok:false,reason:'Espécie já desbloqueada.'};
    if(this.points<spec.price)return {ok:false,reason:`São necessários ${spec.price} pontos de treino.`};
    this.points-=spec.price;this.unlocked.push(id);return {ok:true,cost:spec.price};
  }
  discover(id){
    if(!SPECIES[id]||this.unlocked.includes(id))return false;
    this.unlocked.push(id);return true;
  }
  select(id){if(!this.unlocked.includes(id))return false;this.species=id;return true;}
  get stats(){
    const spec=SPECIES[this.species];
    return {maxEnergy:Math.round(100*spec.stamina+this.skills.stamina*22),
      regen:12*spec.stamina+this.skills.stamina*2,
      drain:17/Math.max(.7,spec.stamina),
      flightSpeed:31*spec.speed*(1+this.skills.speed*.09),
      boostSpeed:49*spec.speed*(1+this.skills.speed*.09),
      groundSpeed:11*(1+this.skills.speed*.06),
      fireDamage:spec.fire+this.skills.fire*.65,
      fireCost:13*(1-.08*this.skills.fire),
      fireCooldown:.30*(1-.08*this.skills.fire)};
  }
}
