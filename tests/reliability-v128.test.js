import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const src=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('armazenamento GLB aguarda commit de transação e não apenas onsuccess do request',()=>{
 const code=src('../src/entities/heroAssetStore.js');
 assert.match(code,/tx\.oncomplete\s*=/);
 assert.match(code,/tx\.onabort\s*=/);
 assert.doesNotMatch(code,/req\.onsuccess\s*=\s*\(\)\s*=>\s*resolve\(req\.result\)/);
});

test('GLB importado manualmente vence restauração assíncrona de modelo antigo',()=>{
 const code=src('../src/ui/HeroAssetUI.js');
 assert.match(code,/this\.hasInteracted\s*=\s*true/);
 assert.match(code,/if\s*\(this\.hasInteracted\s*\|\|\s*this\.busy\)/);
});

test('jogo pausa renderização e lógica pesada quando a aba não está visível',()=>{
 const code=src('../src/game/Game.js');
 assert.match(code,/shouldSkipRendering\(/);
 assert.match(code,/this\.webglLost/);
 assert.match(code,/document\.hidden/);
});

test('a perda de contexto WebGL não deixa o jogo travado silenciosamente',()=>{
 const code=src('../src/game/Game.js');
 assert.match(code,/webglcontextlost/);
 assert.match(code,/webglcontextrestored/);
 assert.match(code,/handleFrameFailure\(/);
});

test('diagnóstico F3 mostra chamadas GPU, triângulos e ativos do jogo',()=>{
 const code=src('../src/game/Game.js'),html=src('../index.html');
 assert.match(code,/this\.input\.consume\('f3'\)/);
 assert.match(html,/id="performance-panel"/);
 const snapshot=src('../src/systems/PerformanceDiagnostics.js');
 assert.match(snapshot,/triangles/);
 assert.match(snapshot,/calls/);
});

test('bootstrap não força perda do contexto WebGL durante a verificação inicial',()=>{
 assert.doesNotMatch(src('../src/main.js'),/loseContext\(\)/);
});
