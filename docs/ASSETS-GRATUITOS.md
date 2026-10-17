# Assets 3D gratuitos pesquisados — Asas de Brumária v1.2.5

Fontes consultadas em 17/10/2026. **Nenhum modelo de terceiros foi incluído automaticamente**: os downloads são feitos pelo usuário a partir das páginas oficiais e a licença deve ser conferida no momento da utilização.

| Fonte / pacote | Uso sugerido | Formatos informados | Licença observada | Link |
| --- | --- | --- | --- | --- |
| KayKit Adventurers, versão Free | Personagem principal 3D rigado e animado | glTF, FBX | CC0 | https://kaylousberg.itch.io/kaykit-adventurers |
| KayKit Character Animations | Caminhar, correr, gestos e combate para rigs KayKit | glTF, FBX | CC0 | https://kaylousberg.itch.io/kaykit-character-animations |
| Quaternius RPG Character Pack | Alternativas de herói e NPCs fantasy | glTF, OBJ, FBX, Blend | CC0 indicado pelo pacote | https://quaternius.com/packs/rpgcharacters.html |
| Kenney Platformer Kit | Terrenos, plataformas, detalhes ambientais | OBJ, FBX, glTF | CC0 | https://kenney.nl/assets/platformer-kit |
| Adobe Mixamo | Animações/rigger de humanoides bípedes | FBX | Uso gratuito nos jogos; termos próprios Adobe | https://www.mixamo.com |

Recomendação técnica: para o primeiro modelo real do jogador, usar **KayKit Adventurers** (estilo compatível com o jogo). Escolher um rig já animado, converter o personagem para GLB autocontido quando necessário e utilizar o módulo `heroAssetLoader.js`. Mixamo é opcional para animações, com atenção ao retargeting do esqueleto. Evite packs com licenças indeterminadas ou cópias de franquias comerciais.

## Notas de implementação
- Three.js importa GLB por `GLTFLoader` sob demanda; o módulo de carregamento opcional não é ativado sem arquivo local e configuração expressa.
- Não criar dependência de CDN extra para usuários que utilizam o personagem procedural.
- Converter e comprimir texturas para reduzir tempo de download no GitHub Pages.
- Por enquanto, o modelo GLB opcional substitui apenas o personagem a pé. A montaria mantém a malha procedural até termos animação de montar.
- O jogo tem personagens originais; use assets licenciados, não modelos extraídos do filme.
