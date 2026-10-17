# Modelos opcionais do personagem

Esta pasta não contém arquivos de terceiros para manter o pacote leve e seguro.

Para substituir o **personagem a pé** por um GLB de origem permitida:
1. Baixe um personagem em glTF/GLB de uma das fontes documentadas em `docs/ASSETS-GRATUITOS.md`.
2. Converta para **GLB autocontido** em Blender se necessário (File > Export > glTF 2.0 > glTF Binary).
3. Salve como `assets/models/hero.glb`.
4. Edite `src/entities/heroAssetConfig.js` e troque `null` por `'./assets/models/hero.glb'`.
5. Se necessário, ajuste `HERO_MODEL_FACING_YAW` para combinar com o eixo frontal. A animação reconhece automaticamente nomes contendo Idle, Walk e Run.

O personagem no dragão permanece procedural até existir uma animação própria de montaria para o rig importado. Erros de carregamento não interrompem as missões: usa-se o personagem original.

Verifique e preserve o arquivo de licença de cada asset. Não copie assets de jogos ou filmes protegidos.
