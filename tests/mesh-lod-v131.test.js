import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const code=p=>readFileSync(resolve(root,p),'utf8');

test('LOD geométrico mantém malha rica perto e substitui no meio', async()=>{
 const {dragonMeshVisibility}=await import('../src/systems/DragonMeshLOD.js');
 assert.deepEqual(dragonMeshVisibility('full'),{high:true,low:false});
 assert.deepEqual(dragonMeshVisibility('limited'),{high:false,low:true});
 assert.deepEqual(dragonMeshVisibility('hidden'),{high:false,low:false});
});
test('proxy possui geometria compartilhada, menos de dez malhas e nenhuma sombra',()=>{
 const src=code('src/entities/DragonProxy.js');
 assert.match(src,/new THREE\.MeshLambertMaterial/);
 assert.match(src,/castShadow=false/);
 assert.match(src,/new THREE\.SphereGeometry\(1,8,5\)/);
 assert.match(src,/new THREE\.BufferGeometry\(/);
 assert.doesNotMatch(src,/new THREE\.PointLight\(/);
});
test('dragões selvagens alternam malha sem alterar domesticação e posições',()=>{
 const src=code('src/entities/WildDragons.js');
 assert.match(src,/buildDragonProxy\(/);
 assert.match(src,/dragonMeshVisibility\(/);
 assert.match(src,/highDetail\.visible/);
 assert.match(src,/lowDetail\.visible/);
 assert.match(src,/this\.approach\.update/);
});
test('sentinelas alternam geometria e preservam estados de combate',()=>{
 const src=code('src/entities/EnemyDragon.js');
 assert.match(src,/buildDragonProxy\(/);
 assert.match(src,/dragonMeshVisibility\(/);
 assert.match(src,/this\.health/);
 assert.match(src,/onShot\(/);
});
test('atualização de sentinelas reutiliza vetores para evitar coleta de lixo',()=>{
 const src=code('src/entities/EnemyDragon.js');
 assert.match(src,/this\.scratchDestination/);
 assert.match(src,/this\.scratchDirection/);
 assert.match(src,/this\.scratchMuzzle/);
 assert.match(src,/this\.scratchPredicted/);
});
test('placar F3 acompanha quantidade de proxies, preservando diagnóstico existente',()=>{
 const src=code('src/game/Game.js');
 assert.match(src,/actorsProxied/);
 assert.match(src,/renderDiagnostics/);
});
