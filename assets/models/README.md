# Dragão CC0 real (v1.4.13)

O modelo `cethiel-dragon.glb` é a opção 3D externa do Estábulo. Fonte: [Cethiel's Dragon 3D](https://opengameart.org/content/cethiels-dragon-3d), licença **CC0 1.0**, autores Drummyfish e Cethiel.

Foi gerado do arquivo Blender original via `tools/fetch_cc0_dragon.py` e `tools/export_cc0_dragon_blender.py`, com textura embutida e animações `Attack`, `Die`, `Idle`, `Walk`; duas animações novas `Flying` e `Glide` foram criadas sobre os ossos das asas. São **737.604 bytes, 1.900 triângulos, 32 ossos e seis clipes**. Git blob SHA `4a96abde21e180b2d51df9355fc2ad517c3c6e67`.

O usuário pode selecionar **USAR DRAGÃO CC0 REAL** ou **VOLTAR AO DRAGÃO ORIGINAL**; nenhuma mecânica foi substituída. A licença dispensa créditos, mas preservamos este registro de proveniência.

---

# GLB do jogador

Abra o jogo, pressione T e use **IMPORTAR GLB** (não é necessário copiar o arquivo manualmente).
O arquivo de demonstração `hero-demo.glb` é original e de uso livre neste projeto, para testes da importação.
Para usar um modelo definitivo, selecione seu próprio arquivo .glb exportado pelo Blender, sem Draco/Meshopt.
Asas de Brumária usa as malhas apenas como aparência: colisão, missões e salvamentos são preservados.
Modelos são salvos localmente no IndexedDB (até 20 MB), apenas no navegador e origem em que foram importados.
