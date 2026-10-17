import test from 'node:test';
import assert from 'node:assert/strict';
import {HERO_GLB_URL} from '../src/entities/heroAssetConfig.js';
import {readFileSync,existsSync} from 'node:fs';
test('GLB externo é opcional: o personagem original sempre está disponível sem rede adicional',()=>{
 assert.equal(HERO_GLB_URL,null);
 const hero=readFileSync(new URL('../src/entities/Hero.js',import.meta.url),'utf8');
 assert.match(hero,/if\(HERO_GLB_URL\)/);
 assert.match(hero,/buildHero\(/);
});
test('há instruções para assets com origem e licença identificadas',()=>{
 const notes=readFileSync(new URL('../docs/ASSETS-GRATUITOS.md',import.meta.url),'utf8');
 for(const name of ['KayKit','Quaternius','Kenney','CC0'])assert.ok(notes.includes(name));
 assert.ok(existsSync(new URL('../assets/models/README.md',import.meta.url)));
});
