import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {effectLimit,projectileLimit,weatherParticleLimit,shouldThrottleHUD} from '../src/systems/PerformanceBudget.js';
import {suggestedTier,pixelRatioFor} from '../src/systems/GraphicsQuality.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const code=(p)=>readFileSync(resolve(root,p),'utf8');
test('efeitos respeitam um teto por tipo e orçamento de cada GPU',()=>{
 assert.ok(effectLimit('economy')<effectLimit('balanced'));
 assert.ok(effectLimit('balanced')<effectLimit('quality'));
 for(const tier of ['economy','balanced','quality'])assert.ok(effectLimit(tier)<=100);
});
test('projéteis têm teto em cada modo, sem crescimento ilimitado',()=>{
 assert.ok(projectileLimit('economy')<=projectileLimit('quality'));
 assert.ok(projectileLimit('quality')<=32);
 assert.ok(projectileLimit('economy')>=6);
});
test('chuva reduz partículas em computadores modestos',()=>{
 assert.ok(weatherParticleLimit('economy')<weatherParticleLimit('quality'));
 assert.ok(weatherParticleLimit('economy')>=20);
});
test('HUD atualiza com menor frequência no modo econômico',()=>{
 assert.equal(shouldThrottleHUD(.12,'economy'),true);
 assert.equal(shouldThrottleHUD(.12,'quality'),false);
});
test('hardware de 2 GB começa em econômico e GPU desconhecida não inicia no máximo',()=>{
 assert.equal(suggestedTier({deviceMemory:2}),'economy');
 assert.equal(suggestedTier({coarse:false,deviceMemory:0}),'balanced');
 assert.ok(pixelRatioFor('economy',2)<1);
});
test('efeitos são instanciados e não fazem new Mesh por partícula',()=>{
 const src=code('src/systems/Effects.js');
 assert.match(src,/InstancedMesh/);
 assert.doesNotMatch(src,/new THREE\.Mesh\(this\.geometry/);
 assert.match(src,/setQuality\(/);
});
test('fogo usa pool, sem PointLight por disparo e sem alocar mesh continuamente',()=>{
 const src=code('src/game/Game.js');
 assert.match(src,/this\.projectilePool/);
 assert.match(src,/this\.getProjectile/);
 assert.doesNotMatch(src,/new THREE\.PointLight\(color,8,14,2\)/);
 assert.match(src,/projectileLimit\(/);
});
test('qualidade controla clima e orçamento de partículas',()=>{
 const game=code('src/game/Game.js'),weather=code('src/systems/Weather.js');
 assert.match(game,/this\.effects\?\.setQuality\(tier\)/);
 assert.match(game,/this\.weather\?\.setQuality\(tier\)/);
 assert.match(weather,/setQuality\(/);
});
