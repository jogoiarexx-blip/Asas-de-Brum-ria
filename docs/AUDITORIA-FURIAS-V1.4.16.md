# Auditoria técnica v1.4.16 — Asas de Brumária

## Escopo e evidência
Auditoria do código do repositório e dos dois GLBs fornecidos pelo usuário. Não confundir verificações automatizadas com uma partida inteira guiada manualmente. Números de textura/triângulos são dos arquivos reais; FPS em GPUs móveis ainda não foi medido.

| Métrica | Fúria da Noite | Fúria da Luz |
| --- | ---: | ---: |
| Tamanho GLB | 10.397.384 bytes | 11.929.256 bytes |
| Triângulos | 120.250 | 147.342 |
| Malhas/material | 1/1 | 1/1 |
| Ossos / skins | 49 / 1 | 49 / 1 |
| Clipes | 8 | 8 |
| Imagens JPEG / dimensões | 3 × 2048² | 3 × 2048² |
| Extensões glTF obrigatórias especiais | nenhuma | nenhuma |

**Orçamento gráfico:** três texturas 2048² usam até 48 MiB se carregadas em RGBA8 não compactado por espécie, ~64 MiB com a pirâmide de mipmaps. Os dois modelos simultaneamente podem consumir aproximadamente 128 MiB apenas em texturas nesta configuração; contextos WebGL separados (prévia e mundo principal) podem exigir outra cópia dos recursos na GPU. Esses são *cenários de orçamento*, não leitura da memória gráfica do jogador.

## Bugs confirmados e tratados na v1.4.16

1. **Persistência anterior ao render** — `SpeciesDragonModels.installUploaded` salvava binários em IndexedDB antes de renderizar, mesmo quando `GLTFLoader` falhava. **Corrigido:** validação estrutural, tentativa de renderização e só então gravação. Modelos bloqueados são testados no rig da prévia, sem desbloquear ou trocar a espécie jogável.
2. **Perda prematura do modelo anterior** — `SpeciesDragonModels.select` descartava o GLB atual antes de buscar e decodificar o próximo; em caso de erro, havia troca visual brusca. **Corrigido:** mantém o modelo durante carregamento e descarte apenas na troca efetiva ou no fallback apropriado.
3. **Troca de GLB não transacional** — `installDragonGLB` descartava o mixer e geometria antigos antes de verificar o novo mixer. **Corrigido:** prepara o novo visual e reverte em falha de inicialização, preservando o GLB anterior.
4. **Prévia sempre no mesmo estado** — `StablePreview.render` mostrava o modelo GLB em Idle apesar de exibir voo procedural. **Corrigido:** seletor de oito movimentos no estábulo, com correspondência aos estados reais do `AnimationMixer`.
5. **Prévia renderizada em todas as iterações** — mundo e estábulo usam contextos WebGL separados e modelos densos. **Otimizado:** prévia limitada a ~24 desenhos/s, mantendo renderização responsiva ao girar o modelo e o FPS do mundo inalterado.
6. **CI sem navegador após atualização do runner** — Ubuntu 26.04 não era suportado pelo Playwright 1.56.1 configurado; erro de instalação, não do game. **Corrigido:** CI passa a executar ambos os jobs em Ubuntu 24.04, versão compatível.

## Pendências ordenadas por impacto

1. **Distribuição automática dos dois GLBs**: ainda não constam como modelos ativados no GitHub Pages. Para disponibilizar a todos os jogadores, é preciso enviar os arquivos binários à pasta `assets/models/` e ativar o `dragon-species.json`. Sem isso, permanece o visual procedural até que cada navegador receba o GLB pelo botão do estábulo.
2. **LOD e imagens 1K opcionais (mobile)**: criar variante sem modificar arquivos mestres, usando redução de resolução de textura, malha simplificada distante, controle de qualidade do dispositivo e teste diferencial de animações.
3. **Monitor de memória WebGL/contextos**: medir texturas, geometrias, criação e descarte de `WebGLRenderer`, especialmente ao alternar prévias e espécie várias vezes.
4. **Retarget/altura de cavaleiro**: medir o encaixe no dorso com o GLB real em corridas/ataques e revisar offsets por espécie; ainda não certificado no Chromium com os dois GLBs do usuário hospedados.
5. **Benchmark em hardware real**: verificar FPS, perda de contexto e desempenho em celular Android, notebook sem GPU dedicada e GPU de desktop. O runner Chromium/SwiftShader não representa esses dispositivos.

## Restrições preservadas
- Fúria da Noite segue como principal. Fúria da Luz só é jogável após desbloqueio por 4 pontos.
- Save da campanha, progresso de missão, colisões, controles e vantagens dos dragões não foram reescritos.
- Não foram alterados os arquivos 3D fornecidos pelo usuário.
- Falhas de armazenamento isolam o GLB e preservam um fallback procedural.
