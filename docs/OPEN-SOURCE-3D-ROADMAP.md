# Biblioteca open source para evolução visual de Asas de Brumária

Pesquisa atualizada em 19/10/2026. O jogo já possui Three.js r180, importação opcional de GLB para o herói, animações procedurais articuladas, LOD e testes Chromium. O objetivo é migrar aos poucos para **assets originais e legais, sem perder desempenho ou transformar GitHub Pages em aplicativo que exige build**.

## Fontes de assets gratuitas com licença verificada

| Prioridade | Acervo / URL | Licença publicada | Uso concreto | Advertência |
| --- | --- | --- | --- | --- |
| **P0** | [Cethiel’s Dragon 3D (OpenGameArt)](https://opengameart.org/content/cethiels-dragon-3d) | **CC0 declarado pelo autor** | **Melhor candidato para validar um dragão realmente rigado e animado**. Pacote `dragon_oga.zip` de 1,4 MB com duas texturas. Usar como personagem experimental ou referência para o rig de dragões originais | Fazer download, inspecionar formatos/clipes, exportar a GLB no Blender e checar animações no Chromium **antes** de equipar. Não presumir compatibilidade automática das juntas. |
| P0 | [Quaternius – Ultimate Monsters](https://quaternius.com/packs/ultimatemonsters.html) | CC0 no pacote | Referências e possíveis modelos para filhotes, animais mágicos e inimigos animados (50 monstros) | Verificar os formatos e clipes dentro do download antes de converter para GLB. Não usar como modelo definitivo do dragão sem verificar adequação visual. |
| P0 | [Quaternius – Ultimate Animated Animal Pack](https://quaternius.com/packs/ultimateanimatedanimals.html) | CC0 no pacote | Fauna da floresta, personagens naturais, movimentos de caminhada/repouso | Não contém necessariamente dragões; ajustar escala, animações e estilo. |
| P0 | [Kenney – Nature Kit](https://kenney.nl/assets/nature-kit) | CC0 | Árvores, pedras, pedras pequenas, troncos, vegetação; 330 elementos | Escolher uma paleta coerente. Usar InstancedMesh para dezenas de árvores repetidas. |
| P1 | [Kenney – Fantasy Town Kit](https://kenney.nl/assets/fantasy-town-kit) | CC0 | Vila, estábulo, tendas, pontes, muros e interiores; 160 elementos | Manter colisores originais até medir dimensões e posição do novo modelo. |
| P1 | [Kenney – Modular Cave Kit](https://kenney.nl/assets/modular-cave-kit) | CC0 | Cavernas nas montanhas, cavernas de filhotes, ruínas | Testar navegação e câmera; não criar obstáculos invisíveis. |
| P1 | [Poly Haven](https://polyhaven.com/license) | CC0 para seus assets | HDRI de iluminação e texturas de pedra, madeira, couro, areia e céu | Preferir 1K–2K; evitar HDRI muito pesado e excesso de reflexos em aparelhos móveis. |
| P1 | [ambientCG](https://ambientcg.com/) | CC0 (confirmar em cada página) | Materiais PBR de pedra, madeira, telhado e terreno | Converter mapas adequados para texturas leves; não aplicar normal map caro a objetos distantes. |
| P2 | [Kenney – Fantasy UI Borders](https://kenney.nl/assets/fantasy-ui-borders) | CC0 | Interface das missões, barras de vida do chefe e inventário | Não prejudicar legibilidade no celular. |
| P2 | [Kenney – UI Pack – Adventure](https://kenney.nl/assets/ui-pack-adventure) | CC0 | Estados de botões, menus e confirmação de missão | Garantir navegação por teclado/gamepad. |

**Observação:** são fontes para seleção e importação futura, não downloads automaticamente adicionados ao jogo. A licença CC0 de um pacote não cobre modelos de outros autores na mesma plataforma.

## Ferramentas de código aberto (não são bancos de modelos)

| Ferramenta / repositório | Licença | Aumento de qualidade proposto | Como integrar sem riscos |
| --- | --- | --- | --- |
| [Blender](https://www.blender.org/) e seu Rigify | GPL (software) | Criar dragões originais: corpo esculpido, pescoço, esqueleto, membrana das asas, morphs de expressões, UVs | Autorizar modelos GLB exportados; a licença do aplicativo não obriga o GLB original a usar GPL. |
| [glTF-Transform](https://github.com/donmccurdy/glTF-Transform) | MIT | Medir, validar e otimizar GLB e texturas em lote, inclusive animações | Pipeline opcional offline em `tools/modelPipeline.mjs`. Nunca executar `optimize` padrão nos rigs sem proteger a hierarquia. |
| [Meshoptimizer/gltfpack](https://github.com/zeux/meshoptimizer) | MIT | Compactar malhas e animações e gerar LODs de modelos importados | Só ativar `EXT_meshopt_compression` depois de fornecer decoder ao `GLTFLoader`. Atualmente bloqueado pela validação de importação. |
| [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) | MIT | Colisão precisa de dragões com cenário detalhado e raycasts rápidos | Testar em ilha isolada; não substituir colisão do mundo de uma vez. |
| [Yuka](https://github.com/Mugen87/yuka) | MIT | IA de sentinelas: patrulhas, flanqueamento, percepções, perseguição aérea | Novo agente apenas para inimigos no primeiro piloto; manter máquinas de estados do jogo. |
| [Rapier 3D](https://rapier.rs/docs/user_guides/javascript/getting_started_js/) | Open source | Física de destroços, caixas e colisões dinâmicas | WASM opt-in e apenas física secundária. Não trocar voo e salvamentos sem testes extensivos. |
| [howler.js](https://github.com/goldfire/howler.js) | MIT | Áudio espacial para asas, rugidos, vento, fogo, água e carinho | Carregar somente se necessário; atualmente o jogo já tem sistema de áudio e deve ser preservado. |
| [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) | MIT do Three.js | Importar GLB 3D com skeletons e clipes de animação | Já usado no herói; criar caminho separado e opcional para futuros dragões importados. |

## Primeiro teste de dragão GLB externo (opcional)

A partir do importador novo, no **Estábulo dos Dragões → DRAGÃO 3D · TESTE DE MODELO EXTERNO**, existe um botão **IMPORTAR DRAGÃO GLB** e um botão **VOLTAR AO DRAGÃO ORIGINAL**. Isso permite testar um dragão com geometria própria, sem alterar combate, saves, física, hitboxes nem modelo do cavaleiro.

**Cethiel's Dragon 3D (CC0):** [fonte e ZIP original](https://opengameart.org/content/cethiels-dragon-3d). O autor declara rig e animações, mas o pacote publicado é `dragon_oga.zip` e **não foi baixado, inspecionado ou convertido automaticamente** nesta fase. Para preparar um teste:
1. Baixe `dragon_oga.zip` da página oficial, confira os arquivos e importe no Blender com o importador correspondente ao formato encontrado.
2. Confira se armature, bones, texturas e ações/animações aparecem no Blender. Se houver múltiplas ações, organize-as como ações exportáveis ou trilhas NLA para glTF.
3. Exporte como `glTF 2.0 → glTF Binary (.glb)` com malhas, texturas internas, skinning e animações habilitados. Mantenha o modelo enxuto para testar WebGL em dispositivos móveis.
4. Rode `npm run assets:inspect -- caminho/dragao.glb` para ver quantidades de malhas, animações, ossos e extensões requeridas. O primeiro teste deve usar um GLB **sem Draco, Meshopt ou KTX2**, conforme o importador atual.
5. Abra o jogo no navegador, entre no estábulo, importe o `.glb` e avalie voo, pouso, caminhada, combate, cavaleiro e distância da câmera; depois use **VOLTAR AO DRAGÃO ORIGINAL** para comparar. O jogo procura nomes de animações (idle, walk, fly, glide, takeoff, land, attack, hurt); se faltarem clipes, o modelo será exibido com as animações presentes e o painel avisará sobre ausência de voo específico.

**Limites e segurança:** o arquivo só é lido quando o jogador escolhe importar. Ao falhar, o dragão original permanece. O arquivo pode ser guardado no IndexedDB separado do save normal até 20 MB; a aparência externa não faz parte do formato de save da campanha. As espécies originais continuam jogáveis quando não existe GLB importado.

## Ordem de implementação sugerida

1. **Criar um dragão original no Blender** usando rig com controles de ombros, cotovelos, punhos, patas, cauda e mandíbula. Usar Quaternius apenas como referência estética ou para NPCs, não copiar personagens protegidos.
2. **Estabelecer orçamento de modelos:** dragão próximo com ideal inicial de até 15–25 mil triângulos, até 4 materiais e textura 1024–2048, ajustando conforme benchmark em GPU real; filhotes/NPCs com até 3–8 mil triângulos e LOD distante. São *metas de projeto*, não restrições universais.
3. **Inspecionar antes de importar:** `npm run assets:inspect -- caminho/modelo.glb`. Conferir triângulos, materials, skins, animações e extensões aceitas.
4. **Otimizar sem quebrar rig:** `npm install -g @gltf-transform/cli` e `npm run assets:optimize -- original.glb otimizado.glb`. O comando evita Draco, Meshopt, KTX2 e fusão de nós animados. Testar o modelo otimizado lado a lado antes de publicá-lo.
5. **Testar um cenário-piloto:** Quaternius/Kenney no ambiente do estábulo (uma cabana e dois objetos) preservando colisores. Medir WebGL draw calls, FPS e tempo de carregamento com `tests/browser-performance.mjs`.
6. **Expandir por fases:** floresta → vila → filhotes → criaturas selvagens → dragões jogáveis → chefe, mantendo fallback procedural e a possibilidade de jogar offline.
7. **Som e IA:** quando visuais estiverem estáveis, usar Yuka para perceber e perseguir e howler.js para sons posicionais; não instalar bibliotecas para funcionalidades que os sistemas próprios já realizam bem.

## Avisos de compatibilidade específicos deste projeto

- O importador atual de herói em `src/entities/glbValidation.js` rejeita GLB que **exige** `KHR_draco_mesh_compression`, `EXT_meshopt_compression`, `KHR_texture_basisu` ou `EXT_texture_avif`. Não recomendar essas compressões sem instalar seus decodificadores e validar no GitHub Pages.
- Usar `--flatten false --join false` evita destruir a hierarquia das animações em `glTF-Transform`. O pipeline também desativa simplificação e reamostragem para a primeira integração.
- Mixamo é gratuito sob termos Adobe, **não** é projeto open source ou banco CC0.
- Não usar modelos, personagens, sons, nomes, logos ou animações extraídos de franquias cinematográficas. O Asas de Brumária mantém suas espécies e identidade originais.
- **Estado atual:** as fontes foram pesquisadas e uma ferramenta de auditoria GLB foi preparada. Nenhum modelo CC0 foi selecionado, copiado, convertido ou instalado automaticamente nesta revisão.
