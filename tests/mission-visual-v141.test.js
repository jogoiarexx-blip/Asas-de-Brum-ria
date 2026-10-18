import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {objectiveGuidance,missionObjectiveName} from '../src/systems/ObjectiveGuidance.js';
import {CONTRACTS,VillageContracts} from '../src/systems/VillageContracts.js';
import {terrainPalette} from '../src/world/TerrainPalette.js';
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');

test('bússola identifica esquerda, direita, frente e atrás a partir do yaw',()=>{
  const pos={x:0,y:12,z:0};
  assert.equal(objectiveGuidance(pos,{x:0,y:12,z:-80},0).direction,'FRENTE');
  assert.equal(objectiveGuidance(pos,{x:80,y:12,z:0},0).direction,'DIREITA');
  assert.equal(objectiveGuidance(pos,{x:-80,y:12,z:0},0).direction,'ESQUERDA');
  assert.equal(objectiveGuidance(pos,{x:0,y:12,z:80},0).direction,'ATRÁS');
});
test('bússola mostra diferença de altitude e distância sem arredondamento inválido',()=>{
  const up=objectiveGuidance({x:1,y:10,z:1},{x:1,y:35,z:-19},0);
  assert.equal(up.altitudeHint,'SUBA 25 m');assert.equal(up.distance,32);
  const down=objectiveGuidance({x:0,y:30,z:0},{x:0,y:5,z:-10},0);
  assert.equal(down.altitudeHint,'DESÇA 25 m');
  assert.equal(objectiveGuidance({x:0,y:0,z:0},null,0),null);
});
test('bússola retorna alvos próximos e lida com ângulos extremos',()=>{
  const near=objectiveGuidance({x:0,y:0,z:0},{x:2,y:0,z:2},100);
  assert.equal(near.near,true);
  const n=objectiveGuidance({x:0,y:0,z:0},{x:0,y:0,z:-100},Math.PI*20);
  assert.equal(n.direction,'FRENTE');
});
test('missão da sentinela anuncia o combate, filhotes identificam santuário',()=>{
  assert.match(missionObjectiveName(4,false,false),/SENTINELA/);
  assert.match(missionObjectiveName(5,true,false),/SANTUÁRIO/);
  assert.match(missionObjectiveName(5,false,false),/FILHOTE/);
});
test('contrato aéreo de patrulha reabre no dia seguinte mantendo save da história',()=>{
  assert.ok(CONTRACTS.patrulha?.requiresMount);
  const state=new VillageContracts(null,1);
  assert.equal(state.talk('tavi').action,'accepted');
  for(let i=0;i<3;i++)assert.equal(state.collect('patrulha',i,true),true);
  assert.equal(state.talk('tavi').action,'reward');
  const saved=state.snapshot();
  const restored=new VillageContracts(saved,1);
  assert.equal(restored.state.patrulha.status,'done');
  restored.syncDay(2);
  assert.equal(restored.state.patrulha.status,'idle');
  assert.notDeepEqual(state.points('patrulha'),restored.points('patrulha'));
});
test('paleta do terreno cria transição entre costa, pasto e rochedo',()=>{
  const sand=terrainPalette(.3,.1,0),grass=terrainPalette(8,.1,0),rock=terrainPalette(24,.7,0);
  assert.notDeepEqual(sand,grass);assert.notDeepEqual(grass,rock);
  for(const p of [sand,grass,rock])assert.ok(p.every(v=>v>=0&&v<=1));
});
test('renderizador usa os novos materiais gráficos leves',()=>{
  const world=read('../src/world/World.js'),weather=read('../src/systems/Weather.js');
  assert.match(world,/import \{terrainPalette\} from '\.\/TerrainPalette\.js'/);assert.match(world,/terrainPalette\(/);assert.match(world,/bumpMap:waterTexture/);
  assert.match(weather,/makeRainStreakTexture\(/);
});
test('interface apresenta orientação de objetivo e corrige sobreposição no minimapa',()=>{
  const ui=read('../src/ui/UI.js'),html=read('../index.html'),css=read('../src/ui/style.css');
  assert.match(ui,/objectiveGuidance\(/);assert.match(html,/id="mission-compass"/);
  assert.match(css,/\.mission-compass/);assert.match(css,/\.mountain-status/);
});
test('etapa final orienta o jogador até a vila, em vez de ficar sem waypoint',()=>{
 const source=read('../src/systems/Missions.js');
 assert.match(source,/if\(this\.stage===6\)return new THREE\.Vector3/);
});
