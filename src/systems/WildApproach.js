// Behavioral logic stays independent of rendering and save data.
// A bond (0..3 hearts) is permanent; this brief calm state is not.
export const APPROACH_RULES=Object.freeze({
  brasa:{seconds:1.05,maxSpeed:11,alert:0},
  raio:{seconds:1.55,maxSpeed:11,alert:0},
  nimbo:{seconds:2.2,maxSpeed:5.4,alert:1.7}
});
const clamp=(v,low,high)=>Math.max(low,Math.min(high,v));
export class WildApproach {
  constructor(){this.states=Object.fromEntries(Object.keys(APPROACH_RULES).map(id=>[id,{calm:0,startledUntil:0,mood:'distante'}]));}
  get(id){return this.states[id]??{calm:0,startledUntil:0,mood:'distante'};}
  ready(id,distance){const s=this.get(id);return Number.isFinite(distance)&&distance<=8.2&&s.mood==='tranquilo'&&s.calm>=1;}
  update(id,dt,time,{distance=Infinity,speed=0,riding=false}={}){
    const s=this.states[id],rule=APPROACH_RULES[id];
    if(!s||!rule)return this.get(id);
    const elapsed=clamp(Number.isFinite(dt)?dt:0,0,.25); // bounded after tab sleeps
    if(riding||!Number.isFinite(distance)||distance>10.5){s.calm=clamp(s.calm-elapsed*.9,0,1);s.mood='distante';return s;}
    if(time<s.startledUntil){s.mood='assustado';return s;}
    if(distance<=8.2 && speed>rule.maxSpeed && rule.alert){s.calm=0;s.startledUntil=time+rule.alert;s.mood='assustado';return s;}
    if(distance<=8.2&&speed<=rule.maxSpeed){s.calm=clamp(s.calm+elapsed/rule.seconds,0,1);s.mood=s.calm>=1?'tranquilo':'observando';}
    else{s.calm=clamp(s.calm-elapsed*.7,0,1);s.mood='observando';}
    return s;
  }
  onBond(id){const s=this.states[id];if(s){s.calm=.12;s.mood='observando';}}
}
