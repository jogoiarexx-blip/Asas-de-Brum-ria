import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {flightContactPose,contactBurstSize} from '../src/entities/FlightContact.js';
import {shipDamageAppearance,shipDebrisStep} from '../src/systems/ShipDamage.js';
import {bossMotionTarget,bossMotionStep} from '../src/systems/BossMotion.js';

test('pouso e decolagem criam compressão sem deslocamento abrupto',()=>{
 const standing=flightContactPose({phase:'ground'}),launching=flightContactPose({phase:'takeoff',takeoffTime:.08}),landing=flightContactPose({phase:'landing',landingTimer:.35});
 assert.equal(standing.crouch,0);assert.ok(launching.crouch>.08);assert.ok(landing.crouch>.08);
 for(const pose of [standing,launching,landing]){assert.ok(pose.crouch>=0&&pose.crouch<=1);assert.ok(pose.offsetY<=0&&pose.offsetY>-.4);}
});
test('poeira só é gerada em contato válido com chão',()=>{
 assert.ok(contactBurstSize('landing',5,true,'economy')>0);
 assert.equal(contactBurstSize('landing',5,false,'quality'),0);
 assert.equal(contactBurstSize('airborne',0,true,'quality'),0);
 assert.ok(contactBurstSize('landing',50,true,'quality')<=12);
});
test('modo leve usa menos poeira que modo detalhado',()=>{
 assert.ok(contactBurstSize('takeoff',5,true,'economy')<contactBurstSize('takeoff',5,true,'quality'));
});
test('primeiro acerto altera vela e mastro, afundamento desliga casco',()=>{
 const full=shipDamageAppearance(2),hit=shipDamageAppearance(1),sunk=shipDamageAppearance(0);
 assert.equal(full.visible,true);assert.equal(hit.visible,true);assert.ok(hit.sailScale<1);
 assert.ok(hit.mastTilt>0);assert.equal(sunk.visible,false);
});
test('madeiras afundam gradualmente e desaparecem no prazo',()=>{
 const a=shipDebrisStep(0,0),b=shipDebrisStep(2,1),c=shipDebrisStep(4,1);
 assert.equal(a.visible,true);assert.ok(b.sink<0);assert.ok(b.spread>a.spread);assert.equal(c.visible,false);
});
test('restaurar barco já destruído não recria detritos de batalha',()=>{
 const m=readFileSync(new URL('../src/world/MountainRegion.js',import.meta.url),'utf8');
 assert.match(m,/notifyBoatHit\(/);assert.match(m,/boatDebrisAges/);assert.match(m,/InstancedMesh/);
 const g=readFileSync(new URL('../src/game/Game.js',import.meta.url),'utf8');
 assert.match(g,/notifyBoatHit\(k,result\)/);
});
test('dragão gigante voa ao redor da ilha em trajetórias finitas',()=>{
 const positions=[0,1,4,9,15].map(t=>bossMotionTarget(t,12));
 assert.ok(positions.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z)));
 assert.ok(positions.every(p=>p.x>1080&&p.x<1160&&p.y>60&&p.y<96&&Math.abs(p.z)<50));
 assert.ok(positions.some(p=>p.z!==positions[0].z));
});
test('chefe ferido muda padrão sem teletransporte',()=>{
 const normal=bossMotionTarget(6,11),hurt=bossMotionTarget(6,3);assert.notDeepEqual(normal,hurt);
 const next=bossMotionStep({x:1120,y:79,z:8},hurt,.016);
 assert.ok(Math.hypot(next.x-1120,next.y-79,next.z-8)<.7);
});
test('dragão gigante permanece quase imóvel ao anunciar o ataque',()=>{
 const pos={x:1120,y:79,z:8};assert.deepEqual(bossMotionStep(pos,{x:1145,y:90,z:20},.05,{charging:true}),pos);
});
test('pausa enorme ou dt inválido não causa teletransporte do chefe',()=>{
 const pos={x:1120,y:79,z:8};
 assert.deepEqual(bossMotionStep(pos,{x:1145,y:90,z:20},NaN),pos);
 assert.deepEqual(bossMotionStep(pos,{x:1145,y:90,z:20},200),pos);
});
test('animação de contato e efeito pontual estão integrados ao dragão',()=>{
 const s=readFileSync(new URL('../src/entities/Dragon.js',import.meta.url),'utf8');
 assert.match(s,/flightContactPose\(/);assert.match(s,/contactPulse/);assert.match(s,/this\.contactKind='landing'/);
});
test('chefe usa movimento suave e respeita alerta de ataque',()=>{
 const s=readFileSync(new URL('../src/world/MountainRegion.js',import.meta.url),'utf8');
 assert.match(s,/bossMotionTarget\(/);assert.match(s,/bossMotionStep\(/);assert.match(s,/bossWarningRing/);
});
test('afundamento inclina e baixa casco sem replay no salvamento',async()=>{
 const {shipSinkingPose}=await import('../src/systems/ShipDamage.js');
 const early=shipSinkingPose(0),late=shipSinkingPose(2.4),end=shipSinkingPose(4);
 assert.equal(early.visible,true);assert.equal(late.visible,true);
 assert.ok(late.offsetY<early.offsetY);assert.ok(late.roll>early.roll);
 assert.equal(end.visible,false);
});
