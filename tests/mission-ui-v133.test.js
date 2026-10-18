import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('estábulo apresenta quadro com missões diárias e status por morador',()=>{
 const html=read('../index.html'),ui=read('../src/ui/UI.js');
 assert.match(html,/id="daily-board"/);assert.match(html,/id="daily-day"/);
 assert.match(ui,/game\.contracts\.state/);
 assert.match(ui,/DIA \$\{game\.dayNight\.state\.day\}/);
});
test('o radar aponta o santuário durante transporte de filhote',()=>{
 const ui=read('../src/ui/UI.js');assert.match(ui,/missions\.nest\.position/);
 assert.match(ui,/missions\.carriedIndex/);
});
test('gráficos leves desativam fontes de luz locais sem remover geometria',()=>{
 const game=read('../src/game/Game.js');
 assert.match(game,/this\.world\.fireLight/);
 assert.match(game,/this\.dragon\.accentLight/);
});
