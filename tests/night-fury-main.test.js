import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Progression,SPECIES,STARTER_SPECIES} from '../src/systems/Progression.js';
const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('Fúria da Noite é principal e Fúria da Luz precisa de desbloqueio',()=>{
  const p=new Progression();
  assert.equal(STARTER_SPECIES,'furia_noite');
  assert.equal(p.species,'furia_noite');
  assert.deepEqual(p.unlocked,['furia_noite']);
  assert.equal(SPECIES.furia_noite.name,'Fúria da Noite');
  assert.equal(p.select('furia_luz'),false);
  assert.equal(p.unlock('furia_luz').ok,false);
  p.grant(4);
  assert.equal(p.unlock('furia_luz').ok,true);
  assert.equal(p.select('furia_luz'),true);
  const restored=new Progression(p.snapshot());
  assert.equal(restored.species,'furia_luz');
  assert.equal(restored.points,0);
  assert.ok(restored.unlocked.includes('furia_noite'));
  assert.ok(restored.unlocked.includes('furia_luz'));
});
test('Saves antigos mantêm missões, upgrades, saldo e migram o companheiro inicial',()=>{
  const original={species:'nimbo',unlocked:['nimbo','raio'],points:11,earned:22,
    skills:{speed:2,stamina:1,fire:3},circuits:5};
  const p=new Progression(original);
  assert.equal(p.species,'furia_noite');
  assert.deepEqual(p.unlocked,['furia_noite','nimbo','raio']);
  assert.equal(p.points,11);assert.equal(p.earned,22);
  assert.deepEqual(p.skills,original.skills);
  assert.equal(p.circuits,5);
  assert.equal(new Progression({...original,species:'raio'}).species,'raio');
});
test('Só dois modelos GLB por espécie; não libera espécie ao carregar aparência',()=>{
  const models=source('../src/entities/SpeciesDragonModels.js');
  const game=source('../src/game/Game.js');
  const page=source('../index.html');
  const preview=source('../src/ui/StablePreview.js');
  assert.match(models,/furia_noite:'\.\.\/\.\.\/assets\/models\/furia-da-noite\.glb'/);
  assert.match(models,/furia_luz:'\.\.\/\.\.\/assets\/models\/furia-da-luz\.glb'/);
  assert.match(models,/manifest\.available/);
  assert.match(models,/this\.queue=this\.queue\.catch/);
  assert.match(game,/new SpeciesDragonModels\(this\.dragon,\{/);
  assert.match(game,/this\.progression\.unlock\(id\)/);
  assert.match(game,/void this\.speciesModels\.select\(id\)/);
  assert.match(game,/void this\.speciesModels\.select\(this\.progression\.species\)/);
  assert.match(preview,/updateDragonGLB\(this\.dragon,frameDt\)/);
  assert.match(page,/id="species-list"/);
});
test('O GLB importado manualmente é opcional e o reset retoma espécie escolhida',()=>{
  const ui=source('../src/ui/DragonAssetUI.js');
  const loader=source('../src/entities/dragonAssetLoader.js');
  assert.doesNotMatch(ui,/^\s*this\.restoreSaved\(\);/m);
  assert.match(ui,/if\(this\.onReset\)await this\.onReset\(\)/);
  assert.match(loader,/dragon\.visual\.add\(root\)/);
  assert.match(loader,/for\(const \{obj,visible\} of data\.original\)obj\.visible=visible/);
});
