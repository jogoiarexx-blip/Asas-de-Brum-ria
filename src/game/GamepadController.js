/** Standard Gamepad mapping: Xbox/PlayStation/8BitDo controllers supported when
 * the browser reports mapping='standard'. This module has no DOM dependency. */
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const zero={x:0,y:0};
const EMPTY=()=>({connected:false,id:'',held:new Set(),justPressed:new Set(),left:{...zero},right:{...zero},throttle:0,brake:0});
export function deadzoneStick(x=0,y=0,deadzone=.18){
  if(!Number.isFinite(x)||!Number.isFinite(y))return {...zero};
  const magnitude=clamp(Math.hypot(x,y),0,1);
  if(magnitude<=deadzone)return {...zero};
  const scale=(magnitude-deadzone)/(1-deadzone)/Math.max(magnitude,1e-8);
  return {x:x*scale,y:y*scale};
}
const pressed=(pad,index)=>!!pad.buttons?.[index] && (pad.buttons[index].pressed||pad.buttons[index].value>=.55);
const value=(pad,index)=>clamp(Number(pad.buttons?.[index]?.value||0),0,1);
export function readStandardPad(pad){
  const state=EMPTY();if(!pad?.connected||pad.mapping!=='standard')return state;
  state.connected=true;state.id=pad.id||'Controle';
  const held=state.held;
  const bindings={0:'e',1:'escape',2:'f',3:'t',4:'ctrl',5:'space',8:'p',9:'start',10:'shift',11:'q',12:'w',13:'s',14:'a',15:'d'};
  for(const [button,key] of Object.entries(bindings))if(pressed(pad,+button))held.add(key);
  state.throttle=value(pad,7);state.brake=value(pad,6);
  if(state.throttle>.2)held.add('w');
  if(state.brake>.2)held.add('s');
  state.dpad={x:(pressed(pad,15)?1:0)-(pressed(pad,14)?1:0),y:(pressed(pad,13)?1:0)-(pressed(pad,12)?1:0)};
  state.left=deadzoneStick(pad.axes?.[0]??0,pad.axes?.[1]??0);
  state.right=deadzoneStick(pad.axes?.[2]??0,pad.axes?.[3]??0);
  if(state.left.x<-.22)held.add('a'); if(state.left.x>.22)held.add('d');
  if(state.left.y<-.22)held.add('w'); if(state.left.y>.22)held.add('s');
  // Dpad pulses also navigate menus. Left-stick is intentionally not a menu repeat.
  if(pressed(pad,12))held.add('menuup');
  if(pressed(pad,13))held.add('menudown');
  if(pressed(pad,14))held.add('menuleft');
  if(pressed(pad,15))held.add('menuright');
  return state;
}
export class GamepadController {
  constructor(){this.lastHeld=new Set();this.activeIndex=null;this.connected=false;}
  poll(gamepads=[]){
    const pads=Array.from(gamepads??[]);
    let gamepad=pads.find(p=>p?.index===this.activeIndex&&p.connected&&p.mapping==='standard');
    if(!gamepad)gamepad=pads.find(p=>p?.connected&&p.mapping==='standard');
    const current=readStandardPad(gamepad);
    this.activeIndex=gamepad?.index??null;
    current.justPressed=new Set([...current.held].filter(key=>!this.lastHeld.has(key)));
    this.lastHeld=new Set(current.held);
    this.connected=current.connected;
    return current;
  }
}
