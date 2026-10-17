import test from 'node:test';
import assert from 'node:assert/strict';
import {deadzoneStick,readStandardPad,GamepadController} from '../src/game/GamepadController.js';

const button=(pressed=false,value=pressed?1:0)=>({pressed,value});
function pad({axes=[0,0,0,0],pressed=[],triggers={},index=0}={}){
 const buttons=Array.from({length:17},(_,i)=>button(pressed.includes(i)));
 for(const [i,v] of Object.entries(triggers))buttons[+i]=button(v>.5,v);
 return {index,connected:true,mapping:'standard',axes,buttons,id:'Test Gamepad'};
}

test('deadzone impede movimento fantasma em analógicos com drift',()=>{
 assert.deepEqual(deadzoneStick(.08,-.11),{x:0,y:0});
 const a=deadzoneStick(.8,.6); assert.ok(Math.abs(a.x-.8)<.001); assert.ok(Math.abs(a.y-.6)<.001);
});
test('analógico diagonal preserva proporção e não ultrapassa 1',()=>{
 const a=deadzoneStick(.65,-.65);assert.ok(Math.hypot(a.x,a.y)<=1.0001);
 assert.ok(a.x>0&&a.y<0);
});
test('A interage, X usa fogo, Y estábulo, B fecha diálogo',()=>{
 const snap=readStandardPad(pad({pressed:[0,1,2,3]}));
 for(const command of ['e','escape','f','t'])assert.ok(snap.held.has(command),command);
});
test('gatilhos controlam aceleração/freio e shoulder controla altitude',()=>{
 const snap=readStandardPad(pad({pressed:[4,5],triggers:{6:.9,7:.84}}));
 for(const command of ['ctrl','space','w','s'])assert.ok(snap.held.has(command));
 assert.ok(snap.throttle>.8); assert.ok(snap.brake>.8);
});
test('direcional e analógicos mapeiam teclas sem interferir na câmera',()=>{
 const snap=readStandardPad(pad({axes:[-.75,-.8,.5,-.4],pressed:[15]}));
 assert.ok(snap.left.x<-.5);assert.ok(snap.left.y<-.5);
 assert.ok(snap.right.x>.3&&snap.right.y<-.2);
 assert.ok(snap.held.has('a')&&snap.held.has('w')&&snap.held.has('d'));
});
test('botões executam ação somente na borda, não repetem a cada frame',()=>{
 const controller=new GamepadController();
 const first=controller.poll([pad({pressed:[0,2]})]);assert.ok(first.justPressed.has('e')); assert.ok(first.justPressed.has('f'));
 const second=controller.poll([pad({pressed:[0,2]})]);assert.equal(second.justPressed.size,0);
 controller.poll([pad()]);
 const third=controller.poll([pad({pressed:[0]})]);assert.ok(third.justPressed.has('e'));
});
test('desconexão libera todos os comandos sem travar aceleração',()=>{
 const controller=new GamepadController();controller.poll([pad({triggers:{7:1}})]);
 const state=controller.poll([null]);assert.equal(state.connected,false);assert.equal(state.held.size,0);
 assert.equal(state.throttle,0);
});
test('suporta gamepad padrão em índice não-zero',()=>{
 const controller=new GamepadController();const state=controller.poll([null,pad({index:1,pressed:[9]})]);
 assert.ok(state.justPressed.has('start'));assert.equal(state.connected,true);
});
test('controle inválido não impede o jogo com teclado',()=>{
 const controller=new GamepadController();const state=controller.poll([{connected:true,mapping:'',axes:[],buttons:[]},null]);
 assert.equal(state.connected,false);assert.equal(state.held.size,0);
});
test('códigos de menu e início permanecem independentes de ação',()=>{
 const state=readStandardPad(pad({pressed:[8,9,10,11]}));
 for(const key of ['p','start','shift','v'])assert.ok(state.held.has(key));
});
