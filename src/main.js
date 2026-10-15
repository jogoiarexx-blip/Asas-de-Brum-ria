// Importação dinâmica: permite mostrar a mensagem de erro mesmo quando o CDN do Three.js falha.
(async function boot(){
  try {
    const {Game}=await import('./game/Game.js');
    new Game();
  }catch(error){
    console.error('Falha ao iniciar Asas de Brumária:',error);
    const panel=document.getElementById('fatal');
    panel.classList.remove('hidden');
    panel.innerHTML='<h2>Não foi possível abrir o jogo</h2><p>Abra pelo <b>INICIAR-JOGO.bat</b> ou <b>python start_game.py</b>, usando uma conexão com a internet para carregar o Three.js. Se aparecer erro de WebGL, ative a aceleração gráfica do navegador.</p><pre></pre>';
    panel.querySelector('pre').textContent=String(error);
  }
})();
