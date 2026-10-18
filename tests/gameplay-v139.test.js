import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visualContactHeight,terrainAttitude,terrainTraction} from '../src/entities/TerrainResponse.js';
import {bossBattleTactic,bossBattleDestination} from '../src/systems/BossTactics.js';
import {shipWaterSplash,SHIP_SPLASH_START} from '../src/systems/ShipSplash.js';
import {bossMotionStep} from '../src/systems/BossMotion.js';
const source=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const approx=(a,b)=>assert.ok(Math.abs(a-b)<.0001,`${a} != ${b}`);

test('compressão de pouso é somada ao balanço, não apagada',()=>{
 const base=visualContactHeight(0,0),landing=visualContactHeight(-.12,.07);
 approx(base,0);approx(landing,-.05);
 const code=source('../src/entities/Dragon.js');
 assert.match(code,/visualContactHeight\(/);
 assert.doesNotMatch(code,/this\.visual\.position\.y=Math\.sin\(time\*\(3\+this\.speed\*\.07\)\)/);
});
test('terreno plano não inclina o corpo nem prejudica tração',()=>{
 const p=terrainAttitude(()=>12,0,0,0,1.5);
 approx(p.pitch,0);approx(p.roll,0);approx(terrainTraction(p),1);
});
test('inclinação possui limites e reduz a tração no solo, nunca no voo',()=>{
 const p=terrainAttitude((x,z)=>x*3+z*1.5,0,0,0,1.5);
 assert.ok(p.roll!==0||p.pitch!==0);
 assert.ok(Math.abs(p.pitch)<=.22&&Math.abs(p.roll)<=.2);
 assert.ok(terrainTraction(p)<1&&terrainTraction(p)>=.43);
});
test('amostras não finitas de solo não criam NaN na física',()=>{
 const p=terrainAttitude(()=>NaN,0,0,0,1.5);
 assert.deepEqual(p,{pitch:0,roll:0,slope:0});
});
test('chefe alterna defesa, perseguição e reposicionamento com vida e distância',()=>{
 assert.equal(bossBattleTactic(45,12).mode,'retreat');
 assert.equal(bossBattleTactic(165,12).mode,'orbit');
 assert.equal(bossBattleTactic(255,12).mode,'approach');
 assert.equal(bossBattleTactic(150,3).mode,'aggressive');
});
test('chefe não persegue jogador fora da arena e não atravessa limites da ilha',()=>{
 const opponent={x:9000,y:500,z:-2000};
 const goal=bossBattleDestination(8,3,opponent);
 assert.ok(goal.x>=1078&&goal.x<=1158,JSON.stringify(goal));
 assert.ok(goal.y>=60&&goal.y<=101,JSON.stringify(goal));
 assert.ok(goal.z>=-35&&goal.z<=51,JSON.stringify(goal));
});
test('alvos do chefe mudam com posição do jogador sem saltos de teleporte',()=>{
 const a=bossBattleDestination(9,8,{x:1080,y:72,z:45});
 const b=bossBattleDestination(9,8,{x:1160,y:72,z:-40});
 assert.notDeepEqual(a,b);
 const from={x:1120,y:79,z:8};const next=bossMotionStep(from,a,.016);
 assert.ok(Math.hypot(next.x-from.x,next.y-from.y,next.z-from.z)<.5);
});
test('preparação e impacto impedem teleporte do chefe',()=>{
 const pos={x:1120,y:79,z:8},goal={x:1130,y:87,z:14};
 assert.deepEqual(bossMotionStep(pos,goal,.016,{charging:true}),pos);
});
test('onda de impacto da embarcação acontece uma vez durante o naufrágio',()=>{
 assert.equal(shipWaterSplash(SHIP_SPLASH_START-.02).visible,false);
 const wave=shipWaterSplash(SHIP_SPLASH_START+.1);
 assert.equal(wave.visible,true);assert.ok(wave.radius>1);assert.ok(wave.opacity>0);
 assert.equal(shipWaterSplash(9).visible,false);
});
test('restauração de barcos afundados não recria a onda sem naufrágio ativo',()=>{
 const code=source('../src/world/MountainRegion.js');
 assert.match(code,/boatRipples/);assert.match(code,/shipWaterSplash\(/);
 assert.match(code,/this\.boatDebrisAges\[i\]/);
});
test('atualização da região usa posição do jogador para tática do chefe',()=>{
 const mountain=source('../src/world/MountainRegion.js');const game=source('../src/game/Game.js');
 assert.match(mountain,/bossBattleDestination\(/);
 assert.match(game,/this\.mountain\.update\(dt,this\.elapsed,this\.dragon\.group\.position\)/);
});
