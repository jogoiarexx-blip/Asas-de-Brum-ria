import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function walk(folder) {
  return readdirSync(folder,{withFileTypes:true}).flatMap(entry => {
    const p=path.join(folder,entry.name);return entry.isDirectory()?walk(p):[p];
  });
}
const jsFiles=walk(path.join(root,'src')).filter(p=>p.endsWith('.js'));
let imports=0;
for(const file of jsFiles) {
  const content=readFileSync(file,'utf8');
  for(const match of content.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)) {
    imports++;
    const importFile=path.resolve(path.dirname(file),match[1]);
    assert.ok(existsSync(importFile),`Caminho inválido: ${file} -> ${match[1]}`);
  }
}
assert.ok(existsSync(path.join(root,'index.html')));
console.log(`Verificação de estrutura: ${jsFiles.length} módulos locais, ${imports} imports relativos válidos.`);
const html=readFileSync(path.join(root,'index.html'),'utf8');
const requiredIds=['game','start-btn','quest-title','quest-progress','mini-map','energy-number','energy-bar','health-number','health-bar','hurt-overlay','target-lock','stable','stable-toggle','species-list','skill-list','train-start','train-points','training-status','new-game-btn'];
for(const id of requiredIds)assert.ok(html.includes(`id="${id}"`),`HUD sem o elemento ${id}`);
for(const file of jsFiles){
  const contents=readFileSync(file,'utf8');
  // Analisa sintaxe em todos os módulos, sem fazer download do Three.js.
  const {spawnSync}=await import('node:child_process');
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(result.status,0,`Erro de sintaxe em ${file}: ${result.stderr}`);
}
console.log(`HUD: ${requiredIds.length} elementos verificados; sintaxe JS: ${jsFiles.length} módulos OK.`);
