import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CONTRACTS,VillageContracts} from '../src/systems/VillageContracts.js';
import {terrainPalette} from '../src/world/TerrainPalette.js';
const src=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('Tavi oferece patrulha diária de três pontos com montaria',()=>{
 const def=CONTRACTS.patrulha;
 assert.equal(def.npc,'tavi');assert.equal(def.requiresMount,true);
 assert.equal(def.points.length,3);
 assert.match(src('../src/entities/VillageNPCs.js'),/id:'tavi'/);
});
test('a patrulha exige montaria e pode ser concluída com três balizas',()=>{
 const b=new VillageContracts(null,1);
 assert.equal(b.talk('tavi').action,'accepted');
 assert.equal(b.collect('patrulha',0,false),false);
 for(let i=0;i<3;i++)assert.equal(b.collect('patrulha',i,true),true);
 assert.equal(b.state.patrulha.status,'ready');
 assert.equal(b.talk('tavi').action,'reward');
});
test('o patrulhamento diário reabre em um novo dia preservando a história',()=>{
 const b=new VillageContracts(null,1);b.talk('tavi');for(let i=0;i<3;i++)b.collect('patrulha',i,true);b.talk('tavi');
 assert.equal(b.state.patrulha.status,'done');b.syncDay(2);
 assert.equal(b.state.patrulha.status,'idle');assert.notDeepEqual(b.points('patrulha'),CONTRACTS.patrulha.points);
});
test('cores da ilha têm gradiente de areia, vegetação e pedra',()=>{
 const sea=terrainPalette(0,0,0),forest=terrainPalette(8,0,0),mountain=terrainPalette(30,.9,0);
 for(const color of [sea,forest,mountain])assert.ok(color.every(c=>Number.isFinite(c)&&c>=0&&c<=1));
 assert.notDeepEqual(sea,forest);assert.notDeepEqual(forest,mountain);
});
test('água e terreno aprimorados sem custo de novas luzes ou imagens externas',()=>{
 const s=src('../src/world/World.js');
 assert.match(s,/terrainPalette\(/);assert.match(s,/bumpMap:waterTexture/);
 assert.doesNotMatch(src('../src/world/TerrainPalette.js'),/import /);
});
