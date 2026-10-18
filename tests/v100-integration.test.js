import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeSave} from '../src/systems/SaveSystem.js';
import {WildBonds} from '../src/systems/WildBonds.js';
import {WildApproach} from '../src/systems/WildApproach.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('movimento lento é possível a pé sem comprometer o turbo montado',()=>{
  const hero=read('src/entities/Hero.js'),dragon=read('src/entities/Dragon.js');
  assert.match(hero,/slow\?3\.1:9/);
  assert.match(hero,/walkIntent\(/);
  assert.match(dragon,/input\.isDown\('shift'\)/);
  assert.match(hero,/moveSpeed/);
});
test('calma é calculada com velocidade real do jogador antes da interação',()=>{
  const game=read('src/game/Game.js'),wild=read('src/entities/WildDragons.js');
  assert.match(game,/this\.hero\.moveSpeed/);
  assert.match(wild,/this\.approach\.update/);
  assert.match(game,/this\.wildDragons\.approach\.ready/);
  assert.match(game,/this\.wildDragons\.approach\.onBond/);
});
test('melhorias de manobra e pouso ligadas ao modelo sem trocar controles',()=>{
  const dragon=read('src/entities/Dragon.js');
  assert.match(dragon,/smoothedTurn\(this\.turnAxis,turn,dt\)/);
  assert.match(dragon,/airflowTarget\(/);
  assert.match(read('src/entities/Airflow.js'),/height<14/);
  assert.match(dragon,/input\.isDown\('space'\)/);
  assert.match(dragon,/input\.isDown\('ctrl'\)/);
});
test('cuidado com dragão selvagem não produz pontos em dobro depois de salvar',()=>{
  const a=new WildApproach(), bonds=new WildBonds({nimbo:2});
  let t=0;
  for(let i=0;i<55;i++){t+=.05;a.update('nimbo',.05,t,{distance:5,speed:0});}
  assert.equal(a.ready('nimbo',5),true);
  assert.equal(bonds.bond('nimbo',t,true).completed,true);
  a.onBond('nimbo');
  assert.equal(bonds.bond('nimbo',t+10,true).ok,false);
});
test('save anterior restaura missões e amansamento sem depender de estado transitório',()=>{
  const old={version:1,mission:{stage:3,progress:1},progression:{},wildBonds:{brasa:2},player:{heroX:12,heroZ:10}};
  const data=normalizeSave(old);
  assert.equal(data.mission.stage,3);assert.equal(data.wildBonds.brasa,2);
  assert.equal(data.player.heroX,12);
  assert.equal(Object.hasOwn(data,'approach'),false);
});
test('sinais visuais comunicam confiança, receio e dicas para celular',()=>{
  const ui=read('src/ui/UI.js'),html=read('index.html');
  assert.match(ui,/ASSUSTADO/);assert.match(ui,/GANHANDO CONFIANÇA/);
  assert.match(ui,/CARINHO/);assert.match(html,/SHIFT/);
});
