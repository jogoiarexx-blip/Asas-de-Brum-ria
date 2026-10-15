# Asas de Brumária — v1.0.0

Um jogo-protótipo **3D em Three.js** sobre amizade, treinamento e aventuras com dragões. Mundo, personagens e nomes originais. Não utiliza personagens, modelos, áudio nem logos de *Como Treinar o Seu Dragão*.

## v1.0.0 — Vínculos Vivos e Voo Assistido

O jogo evolui o encontro com os selvagens, mantendo a campanha e os salvamentos da v0.9.0. **A domesticação agora não é só pressionar E:** aproxime-se a pé, fique perto durante alguns segundos até o indicador de calma chegar a 100% e só então pressione **E** (ou **CARINHO** na tela). São três interações bem-sucedidas com intervalo entre elas. A barra de calma é temporária, mas o vínculo de até três etapas continua salvo.

- **Faísca (corajoso):** ganha confiança rapidamente, mesmo com passos normais.
- **Zéfiro (curioso):** observa por um pouco mais de tempo, mas permite caminhar normalmente.
- **Neblina (tímido):** se assusta com corrida perto dele. Pressione e segure **Shift a pé** (ou **DEVAGAR** no celular) para caminhar lentamente. Se ele se assustar, aguarde e aproxime-se outra vez.

Os modelos selvagens receberam mais detalhes geométricos no dorso, respiração discreta e novas reações da cabeça, mandíbula e asas conforme o humor. O dragão montado ganhou suavização de curva independente da taxa de quadros e **descida assistida** quando você freia para menos de 7 m/s a até 14 m de altura do terreno, sem manter comandos de subida ou descida. **Ctrl continua descendo manualmente**. O uso de Shift montado continua sendo turbo.

**Compatibilidade:** mesma chave de armazenamento de progresso no navegador e mesmo formato de save v1. A calma momentânea não é persistida de propósito; missões, pontos, desbloqueios, posição e amizade permanecem.

**Validação:** 95 testes automatizados de lógica, sintaxe e integração passaram em Node.js 22. O servidor HTTP respondeu aos módulos testados. A execução gráfica WebGL **não foi validada** nesta máquina: o Chromium de automação não conseguiu inicializar EGL/ANGLE, e o ambiente não conseguiu acessar o CDN de Three.js. Teste no Chrome/Edge do computador com WebGL habilitado e conexão à internet. Esta versão ainda não possui modelos GLB de produção nem compilação EXE nativa e não foi publicada no Replit.

## v0.9.0 — Encontro com os Selvagens

Três dragões selvagens vivem em ilhas diferentes: **Faísca** (Brasa, Ilha das Cascatas), **Zéfiro** (Raio, Ilha do Farol) e **Neblina** (Nimbo, Ilha da Névoa). Cada um tem cores, anatomia e animações procedurais próprias.

Voe até a ilha, pouse, desmonte e aproxime-se do dragão. Ganhe calma permanecendo perto e pressione **E** (ou **CARINHO** no celular) três vezes, esperando entre as interações. Neblina exige passos lentos ou espera após se assustar. Ao conquistar a confiança, você recebe **1 ponto de treinamento** uma única vez. Os encontros de Brasa e Raio desbloqueiam gratuitamente essas espécies no estábulo caso ainda não estejam liberadas. O encontro de Neblina dá a recompensa e o registro da amizade.

O minimapa sinaliza os selvagens restantes em lilás. No estábulo, uma nova lista mostra as ilhas, o temperamento e o progresso individual. A atividade é paralela: as sete missões anteriores permanecem intactas. Os vínculos são mantidos no save v1, inclusive ao atualizar de uma versão antiga.

O pacote contém `.replit` e o servidor Python aceita a variável `PORT` e host remoto para facilitar importação no Replit. **Nenhum site ou jogo foi publicado automaticamente.** O Three.js continua carregado via CDN, e gráficos completos exigem internet e WebGL. Dragões selvagens são modelos geométricos procedurais, não arquivos GLB rigados.

## Como jogar

1. Extraia **todo o conteúdo** do ZIP em uma pasta.
2. **Windows:** clique em `INICIAR-JOGO.bat` (requer Python 3 instalado). **Linux/macOS:** execute `python3 start_game.py` nessa pasta.
3. O navegador abrirá o servidor local (geralmente `http://127.0.0.1:8765/`). Precisa de **conexão com a internet** para carregar o Three.js 0.180.0 pelo jsDelivr.
4. Clique em **COMEÇAR A AVENTURA**. Mova-se até o dragão e pressione **E**.

Alternativa: sirva a pasta com qualquer servidor HTTP local. **Não abra `index.html` diretamente pelo `file://`.** Chrome ou Edge recentes com WebGL são recomendados.

### Comandos

| Tecla | Ação |
|---|---|
| W / S | Andar ou avançar/frear voando |
| A / D | Caminhar lateralmente ou girar o dragão |
| E | Conversar, amansar dragões selvagens, montar/desmontar |
| Espaço | Decolar / ganhar altitude |
| Ctrl | Descer / pousar |
| Shift | Montado: turbo (gasta energia). A pé: caminhar devagar para não assustar Neblina |
| F | Sopro de fogo (liberado após Runas Perdidas) |
| T | Abrir/fechar o estábulo e sistema de treinamento |
| C | Alternar o clima para testes (céu, vento, chuva e tempestade) |
| N | Avançar três horas no relógio ambiental para testes |
| G | Alternar qualidade gráfica: automática, leve, equilibrada e detalhada |
| Esc | Fechar o estábulo ou diálogo |
| P | Salvar partida manualmente |
| M | Ativar/desativar áudio |
| R | Voltar à vila |

Em **celulares**, use os botões virtuais de movimento/voo e o botão **ESTÁBULO**. A interface aceita toque, mas o desempenho depende do aparelho.

## Dragões e progressão (mantidos da v0.3.0)

### Três dragões para treinar

- **Nimbo / Asa da Névoa:** início gratuito, equilibrado.
- **Brasa / Fúria Rubra:** custa **2 pontos**, poderoso no sopro de fogo, mas um pouco menos veloz.
- **Raio / Vento Celeste:** custa **3 pontos**, mais veloz, regenera mais energia e tem sopro mais fraco.

São **variantes visuais procedurais** do mesmo modelo-base, com cores, ornamentos próprios de cada espécie e atributos diferentes; ainda não são modelos 3D totalmente distintos nem rigados em GLB.

### Evolução de habilidades

O estábulo fica na **Ilha do Refúgio**, perto da vila. Para **gastar pontos, trocar de dragão ou iniciar circuitos**, retorne até lá e pouse. Abra o painel com **T** ou o botão na interface.

- **Asas fortes:** até 3 níveis; aumenta velocidade normal e turbo.
- **Fôlego:** até 3 níveis; aumenta energia máxima e regeneração.
- **Sopro poderoso:** até 3 níveis; aumenta dano e reduz custo e recarga do fogo.

Cada primeiro nível custa 1 ponto, segundo custa 2, terceiro custa 3. Você ganha pontos concluindo missões e circuitos de treino. O progresso é **compartilhado entre as espécies**.

### Circuito aéreo e sétima missão

No estábulo, clique em **INICIAR CIRCUITO**: voe por três aros dourados, na ordem, em **95 segundos**. Completar rende **1 ponto de treinamento**. Há um intervalo de **25 segundos de tempo de jogo** antes de repetir. A última missão, **Prova do Domador**, é concluída quando você termina um circuito depois do resgate dos filhotes.

### Novidades da v0.4.0 — Vila dos Domadores

**Moradores interativos** (fale com **E** a pé, perto do personagem; no celular o botão muda para FALAR):

- **Iara**, exploradora dos faróis — libera o contrato **Correio dos Céus**. Monte num dragão, entregue três mensagens nos marcadores dourados e volte a falar com Iara para receber **+2 pontos**.
- **Lume**, curandeira — libera **Ervas do Refúgio**. Encontre três ervas verdes **a pé** na ilha inicial; retorne a Lume para receber **+1 ponto** e recuperar resistência.
- **Borin**, mestre da forja — dá orientações sobre o estábulo, habilidades e o circuito avançado.

Você pode realizar os contratos em paralelo com a campanha. Eles só pagam recompensa na primeira conclusão de cada save; o progresso parcial é salvo e restaurado.

**Novo Circuito da Tempestade:** desbloqueado após completar pelo menos um circuito básico, acessível pelo estábulo; cinco aros, **80 segundos**, velocidade mínima de **18 m/s** ao passar pelos aros e **+2 pontos** ao concluir. Ambos os modos compartilham a recarga de 25 segundos.

**Melhorias no dragão:** cadeia hierárquica com seis segmentos de cauda, articulação de cabeça e mandíbula, animação de patas, transição entre bater asas e planar e silhuetas relativas diferentes por espécie. Os modelos continuam **procedurais**; não há rig importado em GLB.

### Novidades da v0.5.0 — Terras Vivas

- **Colisões do cenário:** árvores, pedras e cabanas agora bloqueiam caminhada e avanço do dragão nas alturas correspondentes. Há deslizamento em obstáculos, varredura em vários passos para impedir atravessar paredes no turbo e checagem de altitude para permitir sobrevoar as construções. Ao descer por cima de um objeto alto, o dragão fica sustentado acima do obstáculo até se afastar; não é possível pousar no telhado como solo seguro.
- **Animação aérea:** aceleração vertical suave, transição de decolagem, cruzeiro e pouso; asas com pontas articuladas e mudança do ritmo de batimento conforme o voo. O HUD identifica decolagem e pouso.
- **Dragões visuais:** texturas procedurais geradas em memória com canvas, escamas no corpo, detalhes da sela, sobrancelhas, ornamentos da cabeça e olhos piscando em conjunto com as pupilas. São **modelos 3D procedurais**, não malhas GLB de alta fidelidade.
- **Ilhas vivas:** faixas de espuma costeira, mais tufos de vegetação renderizados com `InstancedMesh` (para reduzir chamadas de desenho), caixas e lanternas decorativas na vila.
- **Salvamento:** mantém a estrutura v1 e os saves anteriores. Os estados de animação não são salvos, sendo reconstruídos ao retomar o voo.

**Atenção:** colisores do cenário são aproximações circulares das formas 3D, não um motor de física completo. Objetos decorativos pequenos permanecem atravessáveis. Jogar em dispositivos móveis mais modestos pode exigir redução da resolução pela configuração do navegador.

### Novidades da v0.6.0 — Céus da Tempestade

- **Clima dinâmico:** quatro condições visuais que se alternam a cada 75–95 segundos de jogo: céu aberto, ventos fortes, chuva e tempestade. Mudam a cor do céu e da neblina, iluminação do mundo, velocidade de deslocamento das nuvens e intensidade de precipitação. Tempestades podem produzir lampejos de relâmpago. A tecla **C** permite alternar manualmente para testar cada condição.
- **Economia de desempenho:** chuva é desenhada com `THREE.Points` e geometrias reutilizadas. A quantidade de gotas diminui em aparelhos com tela de toque.
- **Silhuetas e combate:** Nimbo ganha barbilhões e cristas, Brasa placas e chifres, e Raio aletas aerodinâmicas. O dragão abre a mandíbula e produz brilho no focinho ao atacar, reagindo também quando recebe dano. A paleta dos disparos continua específica de cada espécie.
- **Cinco marcos exploráveis:** totens tridimensionais em cada ilha, mostrados como losangos turquesa no minimapa enquanto não descobertos. Aproxime-se de cada um (até 13 metros horizontalmente, com tolerância vertical para quem está voando) para ganhar **+1 ponto de treinamento uma única vez por marco**. O HUD mostra `EXPLORAÇÃO X/5 MARCOS` e o estábulo apresenta o progresso.
- **Salvamento:** nova posição na campanha NÃO é necessária. O estado de clima e de descobertas é adicionado à mesma chave de save `v1`. Saves da v0.5.0 e anteriores continuam válidos (sem pontos extras dados ao carregar automaticamente).

**Escopo real:** ventos e chuva são efeitos gráficos e atmosféricos e **não alteram a velocidade nem a física de voo**. Os dragões continuam modelos procedurais do mesmo esqueleto, sem rig de animação importado. O clima tem ciclo de dia/noite desde a v0.7.0.

### Novidades da v0.8.0 — Voo Vivo e Performance

- **Vegetação otimizada:** copas, troncos e rochas das ilhas passam a ser desenhados em cinco lotes `THREE.InstancedMesh` (tronco, três camadas de folhas, rochas), em vez de milhares de malhas separadas. Posicionamento, dimensões e volumes de colisão foram preservados. A quantidade real de draw calls depende de materiais/sombras e da GPU.
- **Voo refinado:** curvas de alta velocidade têm sensibilidade mais previsível, inclinação do corpo limitada, inclinação vertical baseada em subida/descida reais, pontas de asas com pequena resposta à curva, cauda articulada acompanhando o movimento e patas ajustadas à decolagem e pouso. O controle W/A/S/D e as teclas de voo continuam os mesmos.
- **Modelo procedimental detalhado:** dentes superiores e inferiores ligados aos respectivos pivôs da cabeça e mandíbula, pequenas cristas cervicais articuladas e garras nas pontas das asas. **Não são** novos modelos GLB e não existe rig de esqueleto externo nesta versão.
- **Qualidade gráfica adaptativa:** começa no perfil recomendado pelo dispositivo; após três amostras consecutivas abaixo de 29 FPS, reduz um nível, com pausa entre mudanças. Após dez amostras acima de 56 FPS, pode aumentar gradualmente. Perfil LEVE reduz resolução interna e desliga sombras. Aperte **G** ou toque em **GRÁFICOS** no HUD para escolher `AUTO`, `LEVE`, `EQUILIBRADO` ou `DETALHADO`. O modo escolhido é salvo separadamente no mesmo navegador e não altera a partida.
- **Compatibilidade:** sete missões, dois contratos, três espécies, marcos, treinos, dia/noite e salvamento `v1` mantidos sem migração.
- **Validação:** 71 testes automatizados passaram (58 anteriores + 13 novos), além de verificação dos arquivos e resposta HTTP do servidor local. A renderização WebGL completa depende do Three.js remoto e não foi comprovada neste ambiente sem acesso ao CDN.

### Novidades da v0.7.0 — O Despertar dos Céus

- **Dia e noite:** ciclo de 720 segundos de jogo por dia, começando por volta de 10:19; sol, lua e estrelas visíveis em seus horários; iluminação, céu e neblina combinados com os quatro estados climáticos. HUD mostra a hora. **N** adianta três horas para testar horários.
- **Vento no voo:** ventos fortes e tempestades agora causam deriva horizontal moderada, limitada a 3,8 m/s, quando o dragão está alto o suficiente. A influência passa pelo mesmo sistema de colisões. Não é uma simulação aerodinâmica completa.
- **Prévia 3D do estábulo:** usa uma instância dos mesmos modelos procedurais do jogo, com botão **VER EM 3D** e rotação por arrastar. Visualizar não compra nem equipa um dragão. Um segundo contexto WebGL só é criado ao abrir o estábulo; em caso de falha, a lista de espécies permanece funcional.
- **Salvamento:** `dayNight` foi adicionado à mesma chave v1 já existente. Saves antigos recebem horário inicial, sem perder missões, contratos, descobertas nem habilidades.
- **Testes:** 58 verificações aprovadas (44 anteriores + 14 novas). Servidor HTTP respondeu corretamente. A renderização gráfica WebGL não foi validada de ponta a ponta: o Chromium headless não concluiu a abertura neste ambiente e o CDN externo não estava acessível para testes.

### Salvamento automático

Partidas são salvas no `localStorage` do navegador: a cada **15 segundos de jogo**, ao montar/desmontar, desbloquear algo, concluir objetivos e quando a página perde o foco ou fecha. **P** força o salvamento manual.

Ao retornar, use **CONTINUAR AVENTURA**. A opção **CRIAR NOVA PARTIDA** pede confirmação e apaga o save local. O sistema mantém: missão e progresso, cristais/orbes/filhotes recolhidos, vida restante dos inimigos, dragão selecionado/desbloqueado, pontos e melhorias, energia/resistência, posição, estado montado/desmontado e estado dos dois contratos da vila, clima e marcos explorados.

**Limitações do save:** válido somente no **mesmo navegador e mesmo endereço de origem**; aba anônima/limpeza de dados pode apagá-lo. Circuitos iniciados, projéteis no ar, temporizadores e posição dos inimigos **não** são preservados na retomada. Se o navegador bloquear armazenamento, é possível continuar jogando sem persistência (P apresenta aviso).

## Campanha principal: sete missões

1. A primeira conexão — monte em seu dragão.
2. O batismo do vento — passe por cinco aros.
3. As runas perdidas — recolha três cristais.
4. Defensores de Brumária — destrua três orbes com fogo.
5. Sentinelas da Tormenta — derrote os três dragões inimigos.
6. Filhotes Perdidos — resgate três filhotes.
7. Prova do Domador — conclua um circuito de treinamento na vila.

## Desenvolvimento e testes

Com **Node.js 20+**, execute `npm run check` para verificações estáticas de imports/sintaxe/IDs de interface e testes de lógica pura. O jogo **não precisa de npm para iniciar**.

Na v0.9.0: **83 testes automatizados aprovados** (71 anteriores + 12 novos) para missões, progressão, salvamento, colisão, voo, clima e descoberta; arquivos verificados por servidor HTTP local. A validação visual completa com WebGL **não foi possível**: o navegador automatizado desta infraestrutura bloqueia endereços locais (`ERR_BLOCKED_BY_ADMINISTRATOR`) e o CDN não está acessível deste contêiner. O jogo deve ser validado em um navegador real, especialmente em dispositivos móveis.

## Organização

```text
asas-de-brumaria/
├── index.html
├── INICIAR-JOGO.bat
├── start_game.py
├── package.json
├── README.md
├── CHANGELOG.md
├── src/
│   ├── game/Game.js, Input.js
│   ├── entities/Dragon.js, Hero.js, EnemyDragon.js, VillageNPCs.js, WildDragons.js
│   ├── systems/Missions.js, Training.js, TrainingConfig.js, Progression.js, SaveSystem.js
│   ├── systems/Weather.js, weatherMath.js, Discovery.js, DayNight.js, dayCycleMath.js, WildBonds.js
│   ├── systems/VillageContracts.js
│   ├── systems/Audio.js, Effects.js, combatMath.js
│   ├── world/World.js, Landmarks.js, config.js
│   ├── ui/UI.js, StablePreview.js, style.css
│   └── utils/math.js
├── .replit (configuração opcional para hospedagem)
└── tests/
```

## Próximas prioridades

Modelos GLB rigados individualmente para cada espécie, física aerodinâmica aprofundada e árvores de diálogo com escolhas ainda não estão implementados.
