import test from 'node:test';
import assert from 'node:assert/strict';
import {HERO_GLB_URL} from '../src/entities/heroAssetConfig.js';
import {readFileSync,existsSync} from 'node:fs';
test('novo cavaleiro configurado como padrão e procedural preservado como reserva',()=>{
 assert.equal(HERO_GLB_URL,'./assets/models/personagem_animado_montaria.glb');
 const hero=readFileSync(new URL('../src/entities/Hero.js',import.meta.url),'utf8');
 const controller=readFileSync(new URL('../src/ui/HeroAssetUI.js',import.meta.url),'utf8');
 assert.match(hero,/buildHero\(/);
 assert.match(controller,/loadSavedHeroGLB\(/);
 assert.match(controller,/response\.ok/);
 assert.match(controller,/install\(new File\(\[data\]/);
});
test('há instruções para assets com origem e licença identificadas',()=>{
 const notes=readFileSync(new URL('../docs/ASSETS-GRATUITOS.md',import.meta.url),'utf8');
 for(const name of ['KayKit','Quaternius','Kenney','CC0'])assert.ok(notes.includes(name));
 assert.ok(existsSync(new URL('../assets/models/README.md',import.meta.url)));
});
