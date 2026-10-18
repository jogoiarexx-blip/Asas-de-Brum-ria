import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,Progression} from '../src/systems/Progression.js';

test('Fúria da Luz tem seis cores válidas e estatísticas jogáveis',()=>{
 const light=SPECIES.furia_luz;
 assert.ok(light);
 assert.equal(light.colors.length,6);
 for(const color of light.colors)assert.ok(Number.isInteger(color)&&color>=0&&color<=0xffffff);
 assert.ok(light.speed>0&&light.stamina>0&&light.fire>0);
});
test('Fúria da Luz pode ser desbloqueado, selecionado e salvo',()=>{
 const p=new Progression();
 assert.equal(p.unlock('furia_luz').ok,false);
 p.grant(6);
 assert.equal(p.unlock('furia_luz').ok,true);
 assert.equal(p.select('furia_luz'),true);
 assert.ok(p.stats.flightSpeed>0);
 const restored=new Progression(p.snapshot());
 assert.equal(restored.species,'furia_luz');
 assert.ok(restored.unlocked.includes('furia_luz'));
 assert.equal(restored.stats.flightSpeed,p.stats.flightSpeed);
});
test('saves antigos preservam espécie anterior e não desbloqueiam Fúria da Luz',()=>{
 const old=new Progression({points:2,earned:7,species:'raio',unlocked:['nimbo','brasa','raio'],skills:{speed:1,stamina:0,fire:1},circuits:3});
 assert.equal(old.species,'raio');
 assert.equal(old.unlocked.includes('furia_luz'),false);
 assert.equal(old.circuits,3);
});
