# Fúrias da Noite e da Luz — publicação automática e modo móvel

## Situação real
O projeto usa **Fúria da Noite** como espécie principal e **Fúria da Luz** como desbloqueável por 4 pontos. O repo contém importação manual pelo estábulo, mas os modelos de 10–12 MB enviados nesta conversa **ainda precisam ser adicionados ao GitHub** para que apareçam automaticamente a todos. O manifesto atual continuará `available:false` até os dois binários estarem presentes.

## Arquivos já preparados no pacote de publicação

| Arquivo para `assets/models/` | Conteúdo | Tamanho medido |
| --- | --- | ---: |
| `furia-da-noite.glb` | Original 2K, 49 ossos, 8 clipes | 10.397.384 bytes |
| `furia-da-luz.glb` | Original 2K, 49 ossos, 8 clipes | 11.929.256 bytes |
| `furia-da-noite-mobile.glb` | Mesma malha/rig/UV/animações, JPEG 1024 px | 5.864.964 bytes (**−43,59%**) |
| `furia-da-luz-mobile.glb` | Mesma malha/rig/UV/animações, JPEG 1024 px | 6.975.024 bytes (**−41,53%**) |
| `dragon-species.json` | `available:true, mobile:true` | Pequeno |
| `asset-qa.json` | Hash SHA-256 e medições de redução | Pequeno |

Os quatro GLBs foram inspecionados em glTF 2.0: **270 segmentos de buffers por arquivo** (exceto 3 bufferViews de imagens) são bit a bit iguais entre mestre e versão mobile, todos os clipes e skins coincidem. Nenhuma geometria foi simplificada: Fúria da Noite continua com 120.250 triângulos e Fúria da Luz com 147.342.

## Publicar automaticamente pelo próprio GitHub (duas etapas)

1. Abra [a pasta assets/models no GitHub](https://github.com/jogoiarexx-blip/Asas-de-Brumaria/tree/main/assets/models). Use **Add file → Upload files** e envie **somente** `furia-da-noite.glb` e `furia-da-luz.glb` da pasta do ZIP fornecido. Os arquivos devem ter exatamente esses nomes; são individuais e menores que 25 MB, portanto compatíveis com o upload normal de arquivos do GitHub.
2. Confirme o commit em `main`. O workflow `publish-furies.yml` é iniciado pelo upload, instala Pillow, produz as duas variantes 1K com `tools/prepare_fury_models.py`, executa `npm run check` e, **apenas depois de passar**, grava os dois arquivos móveis e ativa `dragon-species.json`. Uma nova versão do GitHub Pages passa então a servir os arquivos normalmente.

Se o GitHub Actions não iniciar por atraso/restrição de permissões, abra [Actions → Publicar Furias GLB](https://github.com/jogoiarexx-blip/Asas-de-Brumaria/actions/workflows/publish-furies.yml) e use **Run workflow**. A ação precisa da permissão Contents: write habilitada para o repositório. Nenhum token ou senha é requerido no chat.

### Alternativa
Também é possível enviar manualmente **os quatro GLBs e o manifesto já pronto do ZIP** em um único commit. Execute a suíte de testes antes de considerar a publicação concluída.

## Redução automática de memória gráfica

Na versão 1.4.17, aparelhos com tela de toque, até 4 GB de memória reportada ou economia de dados preferem o arquivo com texturas 1K. Desktops que não se enquadram nessas condições usam os GLBs 2K. Se a versão mobile não existir, há fallback para o GLB completo. Modelos importados manualmente passam por redimensionamento das texturas *antes da primeira renderização* quando o dispositivo exige economia; 512 px se 2 GB ou menos/economia de dados, senão 1024 px. Esse caminho mantém UV, malha, rig e animações; não modifica a campanha nem o arquivo original escolhido pelo usuário.

**Estimativa, não telemetria de GPU:** três texturas RGBA8 2048² podem consumir 48 MiB sem mipmaps (≈64 MiB com mipmaps) por dragão; 1024² fica em 12 MiB (≈16 MiB com mipmaps). O ganho real depende do formato interno e do dispositivo. Texturas não determinam sozinhas FPS de malhas densas; LOD real de geometria ainda é pendência.

## Validação e próximos passos

- `npm run check` testa escolher arquivo mobile por hardware, fallback por 404, preservação de materiais e rig; quando o manifesto estiver ativo, exige ambos os mestres e arquivos móveis com animações e malhas idênticas.
- Os GLBs originais foram validados estruturalmente fora do navegador. Capturas e FPS de hardware real com os dois GLBs ainda dependem do upload e do teste na versão hospedada.
- Próximo ciclo: capturar FPS/p95 com os GLBs reais em uma GPU móvel, criar LOD por geometria (sem quebrar os pesos dos 49 ossos) e medir encaixe do cavaleiro, deformações das asas e da cauda.
