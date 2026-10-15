import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('jogo atualiza os selvagens, controla interação, recompensa e salva uma única vez',()=>{
  const game=read('src/game/Game.js');
  assert.match(game,/this\.wildDragons\.update\(/);
  assert.match(game,/interactWildDragon\(\)/);
  assert.match(game,/this\.wildBonds\.bond\(/);
  assert.match(game,/if\(result\.completed\)/);
  assert.match(game,/this\.progression\.discover\(/);
  assert.match(game,/wildBonds:this\.wildBonds\.snapshot\(\)/);
});
test('UI informa o progresso dos vínculos, interação para celular e pins do mapa',()=>{
  const ui=read('src/ui/UI.js');
  assert.match(ui,/game\.wildDragons\.nearby/);
  assert.match(ui,/CARINHO/);
  assert.match(ui,/GANHANDO CONFIANÇA/);
  assert.match(ui,/AMIZADES/);
  assert.match(ui,/wildDragons\.remaining/);
});
test('porta de hospedagem é configurável para Replit sem abrir navegador remoto',()=>{
  const server=read('start_game.py');
  assert.match(server,/os\.environ\.get\('PORT'\)/);
  assert.match(server,/'0\.0\.0\.0'/);
  assert.match(server,/remote/);
  const replit=read('.replit');
  assert.match(replit,/python3 start_game\.py/);
});
test('estábulo apresenta localização e progresso individual de cada dragão selvagem',()=>{
  const html=read('index.html');
  const ui=read('src/ui/UI.js');
  assert.match(html,/id="wild-list"/);
  assert.match(ui,/WILD_DRAGON_DEFS/);
  assert.match(ui,/wild-list/);
});
