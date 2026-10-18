import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DAY_SECONDS,DEFAULT_PHASE,normalizeDayCycle,advanceDayCycle,clockLabel,daylight,mixHex,skyLighting,windDisplacement} from '../src/systems/dayCycleMath.js';
import {WEATHER_MODES} from '../src/systems/weatherMath.js';
import {normalizeSave,SaveSystem} from '../src/systems/SaveSystem.js';
const minimal={version:1,mission:{stage:4,progress:1},progression:{points:3},player:{x:8,z:7}};
const file=relative=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');

test('ciclo dura 12 minutos sem acumular erro no retorno ao ponto inicial',()=>{
  assert.equal(DAY_SECONDS,720);
  assert.ok(Math.abs(advanceDayCycle({phase:.3},720).phase-.3)<1e-8);
  assert.ok(Math.abs(advanceDayCycle({phase:.3},1440).phase-.3)<1e-8);
});
test('ciclo atravessa meia-noite e preserva minutos excedentes',()=>{
  const state=advanceDayCycle({phase:.98},36);
  assert.ok(Math.abs(state.phase-.03)<1e-8);
  assert.equal(clockLabel(0),'00:00');
  assert.equal(clockLabel(.25),'06:00');
  assert.equal(clockLabel(.5),'12:00');
  assert.equal(clockLabel(.75),'18:00');
});
test('ciclo ignora valores inválidos ou negativos para preservar saves',()=>{
  assert.deepEqual(normalizeDayCycle(),{phase:DEFAULT_PHASE,day:1});
  assert.deepEqual(normalizeDayCycle({phase:Infinity}),{phase:DEFAULT_PHASE,day:1});
  assert.deepEqual(normalizeDayCycle({phase:-50}),{phase:0,day:1});
  assert.deepEqual(advanceDayCycle({phase:.4,day:1},-8),{phase:.4,day:1});
});
test('altitude do sol muda entre manhã, tarde e noite',()=>{
  assert.ok(daylight(.5).sun>.95);
  assert.equal(daylight(0).sun,0);
  assert.ok(daylight(.25).dawn>.2);
  assert.ok(daylight(0).stars>.9);
  assert.equal(daylight(.5).stars,0);
});
test('mistura de cores é estável e limitada aos extremos',()=>{
  assert.equal(mixHex(0xff0000,0x0000ff,0),0xff0000);
  assert.equal(mixHex(0xff0000,0x0000ff,1),0x0000ff);
  assert.equal(mixHex(0x000000,0xffffff,.5),0x808080);
  assert.equal(mixHex(0x000000,0xffffff,4),0xffffff);
});
test('cada clima é escurecido à noite mas conserva luz mínima sem negatividade',()=>{
  for(const weather of WEATHER_MODES){
    const noon=skyLighting(.5,weather),night=skyLighting(0,weather);
    assert.ok(noon.sun>night.sun);
    assert.ok(noon.hemisphere>night.hemisphere);
    assert.ok(night.sun>=0&&night.hemisphere>0);
    assert.ok(noon.sky!==night.sky);
  }
});
test('vento tem deslocamento nulo no chão, sem chuva e sem tempo decorrido',()=>{
  assert.deepEqual(windDisplacement(0,3,.05,20),{x:0,z:0});
  assert.deepEqual(windDisplacement(1,3,0,20),{x:0,z:0});
  assert.deepEqual(windDisplacement(1,3,.05,0),{x:0,z:0});
});
test('vento tem velocidade horizontal limitada a 3,8 metros por segundo',()=>{
  for(const t of [0,2,9,30,75,200]){
    const gust=windDisplacement(1,t,.05,55);
    assert.ok(Math.hypot(gust.x,gust.z)<=3.8*.05+1e-9);
    assert.ok(Math.hypot(gust.x,gust.z)>0);
  }
});
test('vento fraco desloca menos que tempestade nas mesmas condições',()=>{
  const a=windDisplacement(.4,19,.05,50),b=windDisplacement(1,19,.05,50);
  assert.ok(Math.hypot(a.x,a.z)<Math.hypot(b.x,b.z));
});
test('jogador antigo conserva missões e recebe relógio inicial sem perder progressão',()=>{
  const result=normalizeSave(minimal);
  assert.equal(result.mission.stage,4);
  assert.deepEqual(result.dayNight,{phase:DEFAULT_PHASE,day:1});
  assert.equal(result.progression.points,3);
});
test('horário salva e recupera a mesma chave da versão anterior',()=>{
  const db=new Map(),storage={getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)};
  const system=new SaveSystem(storage);
  assert.equal(system.write({...minimal,dayNight:{phase:.82,day:1}}),true);
  assert.deepEqual(system.read().dayNight,{phase:.82,day:1});
});
test('prévia 3D usa exatamente o mesmo Dragon e cada espécie sem compra automática',()=>{
  const preview=file('src/ui/StablePreview.js'),ui=file('src/ui/UI.js');
  assert.match(preview,/new Dragon\(/);
  assert.match(preview,/this\.dragon\.setSpecies\(id,SPECIES\[id\]\)/);
  assert.match(preview,/pointermove/);
  assert.match(ui,/data-preview/);
  assert.match(ui,/showSpecies\(preview\.dataset\.preview\)/);
});
test('mundo e jogo sincronizam sol, lua, estrelas, clima e física de vento',()=>{
  const world=file('src/world/World.js'),game=file('src/game/Game.js'),dragon=file('src/entities/Dragon.js'),weather=file('src/systems/Weather.js');
  assert.match(world,/this\.sunOrb=sunOrb/);
  assert.match(game,/this\.dayNight\.update\(/);
  assert.match(game,/this\.weather\.update\(dt,this\.elapsed,focus,this\.dayNight\.state\.phase\)/);
  assert.match(game,/this\.dragon\.setWind\(this\.weather\.mode\.wind\)/);
  assert.match(dragon,/windDisplacement/);
  assert.match(weather,/skyLighting\(/);
});
test('HUD contém relógio, atalhos e modelo 3D rotativo',()=>{
  const html=file('index.html'),input=file('src/game/Input.js');
  assert.match(html,/id="clock-pill"/);
  assert.match(html,/id="stable-preview-canvas"/);
  assert.match(input,/'n'/);
});
