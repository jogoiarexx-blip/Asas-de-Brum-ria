import test from 'node:test';
import assert from 'node:assert/strict';
import {Input} from '../src/game/Input.js';

function simulate(pads){
  const oldWindow=globalThis.window,oldDocument=globalThis.document,oldNavigator=globalThis.navigator;
  globalThis.window={addEventListener(){}};
  globalThis.document={querySelectorAll:()=>[]};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{getGamepads:()=>pads.current}});
  const clean=()=>{globalThis.window=oldWindow;globalThis.document=oldDocument;Object.defineProperty(globalThis,'navigator',{configurable:true,value:oldNavigator});};
  return {clean,input:new Input()};
}
const pad=(axes,pressed=[])=>({index:0,id:'Mock standard',connected:true,mapping:'standard',axes,
 buttons:Array.from({length:17},(_,i)=>({pressed:pressed.includes(i),value:pressed.includes(i)?1:0}))});
test('input integra analógico com intensidade e não força velocidade máxima',()=>{
 const pads={current:[pad([.55,-.6,0,0])]},env=simulate(pads);
 try{env.input.update();assert.ok(env.input.axis('a','d')>.3 && env.input.axis('a','d')<.55);
 assert.ok(env.input.axis('w','s')<-.3&&env.input.axis('w','s')>-.6);}finally{env.clean();}
});
test('gamepad desconectado libera tecla sem interferir no teclado real',()=>{
 const pads={current:[pad([0,0,0,0],[5])]},env=simulate(pads);
 try{env.input.update();assert.equal(env.input.isDown('space'),true);
 env.input.down.add('w');pads.current=[null];env.input.update();
 assert.equal(env.input.isDown('space'),false);assert.equal(env.input.isDown('w'),true);}finally{env.clean();}
});
test('toque simples não reaplica clique ao segurar botão A',()=>{
 const pads={current:[pad([0,0,0,0],[0])]},env=simulate(pads);
 try{env.input.update();assert.equal(env.input.consume('e'),true);assert.equal(env.input.consume('e'),false);
 env.input.update();assert.equal(env.input.consume('e'),false);
 pads.current=[pad([0,0,0,0])];env.input.update();pads.current=[pad([0,0,0,0],[0])];env.input.update();assert.equal(env.input.consume('e'),true);}finally{env.clean();}
});
test('câmera recebe analógico direito, independente das direções de locomoção',()=>{
 const pads={current:[pad([0,0,.8,-.4])]},env=simulate(pads);
 try{env.input.update();assert.ok(env.input.lookAxis.x>.6);assert.ok(env.input.lookAxis.y<-.25);
 assert.equal(env.input.axis('a','d'),0);}finally{env.clean();}
});
