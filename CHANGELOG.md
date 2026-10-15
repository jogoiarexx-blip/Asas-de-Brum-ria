# Changelog — Asas de Brumária

## v1.0.0 — Vínculos Vivos e Voo Assistido (15/10/2026)
- Domesticação comportamental: a calma aumenta com proximidade e velocidade adequada; não é mais suficiente apertar E imediatamente.
- Personalidades: Faísca se aproxima facilmente, Zéfiro demanda mais paciência e Neblina foge de corridas, exigindo passos lentos (Shift no PC, DEVAGAR no celular) ou espera.
- Estados temporários de animação: observando, tranquilo, assustado; reações de asas, cabeça e mandíbula; respiração e placas dorsais na geometria dos selvagens.
- Controle de voo mais gradual: suavização exponencial de direção (independente do FPS) e pouso assistido em baixa velocidade próximo ao terreno.
- Feedback de interação no HUD, estábulo e interface para toque.
- Save v1 preservado; calma temporal não é persistida, vínculos definitivos continuam salvos.
- 95 testes automatizados aprovados. HTTP verificado. Renderização WebGL não pôde ser confirmada no Chromium deste ambiente (falha EGL/ANGLE e CDN inacessível).
- Não houve publicação em serviço externo. Three.js continua importado do CDN e precisa de internet.

# Histórico de versões

## v0.9.0 — Encontro com os Selvagens

- Faísca, Zéfiro e Neblina aparecem em três ilhas com animações de asas, cabeça e cauda e detalhes individuais.
- Domesticação com três interações a pé, recarga curta e proteção contra recompensas duplicadas.
- Amizades dão um ponto e podem desbloquear Brasa e Raio gratuitamente.
- Minimapa com pins lilases e lista de amizades no estábulo.
- Salvamento v1 retrocompatível, servidor Python com porta de hospedagem e arquivo .replit.
- 83 testes automatizados; endpoints HTTP validados, WebGL não verificado neste ambiente.


## v0.8.0 — Voo Vivo e Performance

- Lotes instanciados para árvores e rochas do arquipélago: cinco malhas de folhagem/rocha substituem a criação de uma malha por tronco, copa ou rocha. Colisores originais continuam ativos.
- Movimento de voo mais estável, com curvas moderadas em velocidade elevada, corpo inclinado com amortecimento, cauda e pontas de asa reagindo ao giro, e patas com transições de decolagem e pouso.
- Anatomia procedural do dragão ganha dentes articulados à mandíbula, cristas cervicais e garras nas extremidades das asas.
- Sistema gráfico com perfis automático, leve, equilibrado e detalhado, controle G/botão no HUD, ajuste de pixel ratio, sombras no nível leve e seleção persistente separada do save.
- 71 testes Node aprovados, incluindo 13 novos para física visual, perfis/histerese e integração de lotes. Sem validação visual completa de WebGL, pois o CDN do Three.js não é alcançável neste ambiente.



## v0.7.0 — O Despertar dos Céus

- Relógio ambiental de 12 minutos, sol/lua/estrelas com transição de iluminação misturada ao clima; HUD e atalho N.
- Vento agora interfere suavemente no voo acima da altitude mínima, até 3,8 m/s, sem contornar colisões.
- Estábulo com prévia 3D interativa dos modelos procedurais de Nimbo, Brasa e Raio; visualização sem compra.
- Salvamento v1 compatível acrescido do estado do dia/noite.
- 58 testes automatizados aprovados; arquivos locais respondendo por HTTP. WebGL completo ainda não validado em browser automatizado.

## v0.6.0 — Céus da Tempestade

- Quatro estados climáticos graduais: céu aberto, ventos, chuva e tempestade, com iluminação e neblina adaptadas.
- Chuva local com `THREE.Points` e relâmpagos ocasionais. Tecla C alterna o clima manualmente.
- Nimbo, Brasa e Raio ganham ornamentos específicos, diferentes detalhes na silhueta e reações ao combate.
- Cinco marcos de descoberta nas ilhas (totens/losangos no mapa), cada um valendo +1 ponto uma vez por partida.
- Extensão compatível de salvamento para clima e descobertas no mesmo formato v1.
- 44 testes aprovados (34 anteriores + 10 novos), incluindo saves antigos, clima, exploração e recompensas únicas.
- Servidor HTTP local verificado; execução WebGL total não testada por bloqueio do navegador automatizado e inacessibilidade do CDN externo no contêiner.


## v0.5.0 — Terras Vivas

- Colisões circulares com árvores, rochedos e casas da vila para caminhada e dragão próximo ao solo; verificação de altura para liberar sobrevoo de obstáculos.
- Resolução por passos de varredura para evitar atravessar obstáculos em alta velocidade, deslizamento junto às bordas, recuperação ao sair de volumes sobrepostos por saves antigos e filtragem espacial de colisores na trajetória.
- Decolagem e descida com aceleração vertical suave, pouso animado, quatro poses de voo e pontas das asas móveis independentemente da base.
- Dragão com padrões de pele e membrana produzidos por CanvasTexture/UV, escamas geométricas no dorso, sela com arreios, sobrancelhas, olhos com piscar sincronizado e mais ornamentos de cabeça.
- Espuma costeira nas cinco ilhas, vegetação variada em meshes instanciados e novos objetos decorativos na vila.
- HUD apresenta estado de decolagem/pouso e nome do dragão ativo na resistência.
- 34 testes automatizados aprovados (23 anteriores + 11 novos), incluindo colisão em passo longo, deslizamento, altitude, save sobreposto e fases de voo.
- Conserva 7 missões, 2 contratos, 3 dragões, circuitos e salvamento v1. A renderização final WebGL ainda precisa ser validada em navegador com acesso ao CDN.


## v0.4.0 — Vila dos Domadores

- Três NPCs originais com modelos procedurais, placas de identificação, gestos e diálogos (Iara, Lume e Borin).
- Dois contratos paralelos jogáveis com coleta contextualizada, retorno ao NPC, recompensa única e marcadores no mundo/minimapa.
- Circuito da Tempestade com cinco checkpoints, 80 segundos e velocidade mínima, desbloqueado após o primeiro treino.
- Dragão aprimorado com cauda encadeada em seis segmentos, cabeça/mandíbula móveis, patas articuladas, olhos animados e batimento de asas adaptado à planagem.
- Persistência de contratos compatível com save v0.3.0; melhor feedback visual no HUD e botão contextual para celular.
- 23 testes de lógica e integridade aprovados; renderização completa ainda exige validação manual com WebGL.


## v0.3.0 — Estábulo dos Dragões

- Três espécies/perfis selecionáveis (Nimbo, Brasa e Raio) com aparência procedural, velocidade, energia e fogo específicos.
- Estábulo na vila: desbloqueios, pontos, compra de habilidades com três níveis e botões para celular.
- Circuito com três aros cronometrados e recompensa renovável.
- Sétima missão: Prova do Domador.
- Salvamento automático e manual em `localStorage`, restauração de missões, inimigos, progressão e personagem.
- Melhorias de fogo escalável, cores de projéteis e informação de energia total no HUD.
- Correção de normalização da tecla Ctrl; correção de save com vida fracionária dos inimigos.
- 17 testes lógicos aprovados; arquivos do servidor HTTP local verificados.

## v0.2.0 — Batalha das Sentinelas

- IA de três dragões inimigos com patrulha, perseguição, desvio, ajuste de altitude e disparos.
- Dragões adversários procedurais com asas, cauda e cabeça animadas.
- Resistência de Nimbo, dano, imunidade temporária e reaparecimento no vilarejo.
- Combate entre equipes com colisão contínua de projéteis e assistência leve de mira.
- Efeitos de impacto, dano e explosões; novos sons gerados por WebAudio.
- Missões 5 e 6: Sentinelas da Tormenta e Filhotes Perdidos.
- Minimapa e HUD ampliados, com sinalização de inimigos e de filhotes.
- Erros de inicialização do Three.js são exibidos ao jogador.
- Nove testes de lógica e verificações de módulos/HTML.

## v0.1.0 — Primeira Conexão

- Arquipélago 3D de cinco ilhas, Nimbo e herói.
- Montaria, caminhada, voo livre, turbo, fogo e controles touch.
- Quatro missões iniciais e efeitos WebAudio.
