import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ExpeditionProgress} from '../src/systems/ExpeditionRules.js';
import {bossAttackPattern,bossShotDirections,bossPatternLabel} from '../src/systems/MountainCombat.js';
import {counterOpportunity,counterStrike} from '../src/systems/BossCounter.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('sopro do chefe abre uma janela curta para contra-ataque',()=>{
 const a=counterOpportunity({volleyFired:true,health:12});
 assert.ok(a>0.7&&a<=2);
 assert.equal(counterOpportunity({volleyFired:false,health:12}),0);
});
test('contra-ataque fora da janela causa dano comum',()=>{
 assert.deepEqual(counterStrike(0),{damage:1,bonus:false});
 assert.deepEqual(counterStrike(-1),{damage:1,bonus:false});
});
test('atingir dentro da janela causa dano dobrado, sem dano infinito',()=>{
 assert.deepEqual(counterStrike(.5),{damage:2,bonus:true});
 assert.deepEqual(counterStrike(NaN),{damage:1,bonus:false});
});
test('dano extra não altera save antigo nem reduz vida abaixo de zero',()=>{
 const progress=new ExpeditionProgress({boatHealth:[0,0,0],bossHealth:2});
 const hit=progress.hitBoss(2);
 assert.ok(hit.hit&&hit.defeated);
 assert.equal(progress.bossHealth,0);
 assert.equal(new ExpeditionProgress(progress.snapshot()).phase,'return');
});
test('dano comum continua valendo quando não foi dado multiplicador',()=>{
 const progress=new ExpeditionProgress({boatHealth:[0,0,0],bossHealth:12});
 progress.hitBoss();assert.equal(progress.bossHealth,11);
});
test('chefe incorpora um quarto padrão de varredura na segunda fase',()=>{
 const modes=new Set(Array.from({length:12},(_,i)=>bossAttackPattern(i,4)));
 for(const mode of ['aimed','fan','vertical','sweep'])assert.ok(modes.has(mode),mode);
 assert.ok(!Array.from({length:8},(_,i)=>bossAttackPattern(i,12)).includes('sweep'));
});
test('varredura tem exatamente três trajetórias normais e aviso específico',()=>{
 const directions=bossShotDirections({x:0,y:0,z:-1},'sweep');
 assert.equal(directions.length,3);
 assert.ok(directions[0].x!==directions[1].x);
 for(const vec of directions)approx(Math.hypot(vec.x,vec.y,vec.z),1);
 assert.match(bossPatternLabel('sweep'),/VARREDURA/);
});
test('combate e HUD integram a janela de resposta sem novos campos no save',()=>{
 const game=read('../src/game/Game.js');
 assert.match(game,/counterOpportunity\(/);
 assert.match(game,/counterStrike\(/);
 assert.match(game,/bossCounterTime/);
 assert.match(game,/CONTRA-ATAQUE/);
});

test('contra-ataque interrompe preparação anterior e reduz movimento do chefe',async()=>{
 const {bossMotionStep}=await import('../src/systems/BossMotion.js');
 const start={x:1120,y:79,z:8},goal={x:1150,y:92,z:25};
 const healthy=bossMotionStep(start,goal,.1),staggered=bossMotionStep(start,goal,.1,{stagger:.3});
 const distance=p=>Math.hypot(p.x-start.x,p.y-start.y,p.z-start.z);
 assert.ok(distance(staggered)<distance(healthy));
 const game=read('../src/game/Game.js');
 assert.match(game,/this\.mountain\.setBossWarning\(false\)/);
});
