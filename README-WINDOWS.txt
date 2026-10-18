NOVO v1.3.8: animações curtas de contato ao pousar/decolar, barcos que adernam e afundam com destroços, chefe com patrulha tridimensional e parada durante aviso de ataque. 378 testes automatizados aprovados.

ASAS DE BRUMÁRIA v1.3.8 — NOVAS MANOBRAS E DRAGÃO GIGANTE

Ao pousar: solte CTRL, reduza a velocidade (S/LT) e procure uma ilha ou plataforma plana. Água, encostas muito inclinadas e bordas não permitem aterrissagem.
Na batalha: observe o aviso colorido do chefe. Vermelho: direcionado. Laranja: leque. Azul: tiros em alturas diferentes. Esquiva: Q / R3 / botão ESQUIVA.

NOVO v1.3.8: Q no teclado, R3 no gamepad ou ESQUIVA no toque. A/D escolhe o lado. Requer voo e 18 de energia; recarga de 2,25 segundos. O dragão gigante fica marcado por danos progressivos.

NOVO V1.3.8: O portal aguarda o novo mapa terminar de carregar. O dragão gigante sinaliza sopro de fogo com um anel vermelho antes de disparar; rochas e efeitos otimizados.

BRUMÁRIA 1.3.8 — NOVO MAPA E OPÇÕES DE GPU

O novo cenário só carrega ao voar para LESTE até o portal azul (X≈328, Z≈35), após desbloquear fogo. Destrua os três barcos, derrote o dragão gigante e retorne para receber recompensa.

⚙ GPU abre opções de alto desempenho/baixo consumo (preferência WebGL, não seleção garantida de placa), resolução de 50/75/100%, sombras e antialias. Reinicie para aplicar. F3 diagnostica desempenho.

BRUMÁRIA 1.3.8 — MISSÕES DIÁRIAS E RESGATE

A versão Windows inicia um servidor local e abre o jogo no navegador; não é EXE nativo.
A primeira execução requer conexão para obter o Three.js, depois utiliza o cache quando possível.

Teclas: T estábulo e quadro diário · N avança 3 horas · F3 desempenho · B comparar FPS.
Missão filhotes: voe lentamente e estabilize-se para recolher; leve cada um ao círculo no Refúgio.
Dia do jogo: 12 minutos por ciclo. Contratos concluídos reabrem no dia seguinte.

VERIFICAÇÃO: 378 testes automatizados sem falhas. Avaliação WebGL em hardware real pendente.

---

ASAS DE BRUMARIA 1.3.8 - WINDOWS (sem Python)

1. Extraia TODOS os arquivos do ZIP para uma pasta.
2. Clique duas vezes em JOGAR-WINDOWS.bat.
3. Aguarde a janela do navegador abrir. Mantenha a janela preta aberta enquanto joga.
4. Na primeira execucao, e necessaria internet para baixar Three.js 0.180.0 (MIT).
5. Depois de baixado, vendor/three.module.js permite jogar offline (se houver suporte a WebGL).
6. Se o Windows bloquear o arquivo, confirme que ele veio de fonte confiavel.
7. Se o PowerShell do Windows nao funcionar, use INICIAR-JOGO.bat com Python 3 instalado.

CONTROLES: WASD mover, E montar/conversar, Espaco subir, Ctrl descer,
Shift turbo/andar devagar, F fogo, T estabulo, P salvar, G graficos,
arrastar no mundo para girar camera, roda do mouse zoom, V recentraliza.

STATUS DOS TESTES: 286 testes automatizados de JS passaram em ambiente Linux.
O inicializador PowerShell nao foi executado num PC Windows nem o WebGL validado no Chromium deste ambiente.
Projeto Three.js web; NAO e um EXE nativo.

CONTROLE USB/BLUETOOTH: compatível com Gamepad API padrão (Xbox, PlayStation e semelhantes).
A Interagir; B Voltar; X Fogo; Y / Start Estábulo; analógico esquerdo mover, direito câmera; LB / RB descer/subir; LT / RT frear/acelerar; L3 Turbo.

GLB: inicie a aventura e pressione T; na secao PERSONAGEM 3D escolha IMPORTAR GLB ou TESTAR MODELO DEMO. A primeira execucao precisa de internet para salvar o leitor oficial GLTFLoader no vendor, alem do Three.js. Apos guardar, permite importar outros GLBs offline.

DESEMPENHO: pressione F3 para ver FPS, draws, triangulos e memoria GPU.
Se perder os graficos WebGL, aguarde restaurar; a qualidade sera reduzida automaticamente.

LOD V1.3.0: personagens e inimigos distantes usam animacao economica; no modo LEVE o F3 mostra estatisticas de personagens ativos.

Asas de Brumária v1.3.1: dragões distantes usam malhas mais leves, herói com animações aprimoradas. F3 mostra a quantidade de proxies.

V1.3.8: F3 abre diagnostico. Pressione B ou clique em COMPARAR FPS (B) para medir aproximadamente 15 segundos dos perfis LEVE, EQUILIBRADO e DETALHADO. O jogo pausa missões e combates durante o teste; depois restaura automaticamente a qualidade original. COPIAR RESULTADOS facilita compartilhar os números.
