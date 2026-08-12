
Atualmente o projeto busca as mãos na pasta da pokerstars em appdata
Então é impossivel usar em produção no estado atual.
Quero algum jeito que em produção na web, acesse a pasta desejada.

Analise do claude:
A descoberta que muda tudo
AppData está na blocklist do Chromium. Olhei o código-fonte: DIR_LOCAL_APP_DATA está listado com kBlockAllChildren — o nível mais restritivo, que bloqueia a pasta e tudo abaixo dela.

Ou seja: C:\Users\igor_\AppData\Local\PokerStars\HandHistory não pode ser selecionada no showDirectoryPicker(). O usuário tenta escolher, o browser recusa. Não tem flag, não tem contorno.

A saída
O PokerStars deixa você mudar onde salva o hand history: Configurações → Playing History → Hand History → Change Folder.

Então o fluxo vira: o usuário aponta o PokerStars pra uma pasta acessível (Documentos\PokerHands, por exemplo), e o app lê de lá. Funciona, mas é um passo de configuração manual fora do nosso app, no cliente do PokerStars — e isso precisa estar no onboarding, muito bem explicado, senão a pessoa trava logo no início.

O que isso significa pro "compartilhar com outras pessoas"
Aqui preciso ser franco, porque muda o cálculo:

Suporte
Chrome / Edge / Opera desktop	✅ Chrome 86+
Firefox	❌ nenhuma versão
Safari (macOS/iOS)	❌ só Origin Private File System
Mobile em geral	❌ não é baseline
Quem usa Firefox ou Safari simplesmente não consegue usar. E todo usuário novo precisa reconfigurar o PokerStars antes de começar.

Por isso vou propor os dois caminhos juntos: File System Access pra quem pode (fluxo bom, lembra a pasta, relê sem re-selecionar) e arrastar arquivos como fallback universal (funciona em qualquer browser, sem reconfigurar nada, mas precisa re-arrastar pra ver mãos novas). Sem o fallback, você perde metade das pessoas antes da primeira tela.

Persistência — a parte que funciona bem
O FileSystemDirectoryHandle pode ser guardado em IndexedDB (cookie não serve — cookie guarda texto, e isso é um objeto com referência real ao sistema de arquivos).

No retorno, o app recupera o handle e chama requestPermission(). Do Chrome 122 em diante o usuário vê três opções: "Permitir desta vez", "Permitir em todas as visitas", "Não permitir". Escolhendo a segunda, ele nunca mais é perguntado.

E tem um bônus: PWA instalado ganha permissão persistente automática, sem prompt nenhum. Como você quer "um app de verdade", instalar como PWA passa a ter valor funcional, não só cosmético.

Arquitetura proposta
A decisão central: migrar a leitura toda pro cliente, não manter dois modos.

hoje:   page.tsx (Server) → fs.readdirSync → parseHandHistory → Hand[]
depois: page.tsx (Client) → directoryHandle → File.text() → parseHandHistory → Hand[]
O parser não muda uma linha — ele é parseHandHistory(text: string), puro, sem fs, desde a Fase 1. Foi desenhado exatamente pra isso. Timeline, reducer, tudo o mais também não muda.

O que muda é só a casca de I/O: handHistorySource.ts deixa de alimentar as páginas e fica só servindo o script de diagnóstico (preview-hands.ts, que roda em Node). Um caminho de código só pra local e produção — sem if (isLocal) espalhado.

E o ganho de privacidade é real, o que importa se você vai compartilhar: os hand histories nunca saem da máquina de quem usa. A Vercel serve só JavaScript.

Fases sugeridas
Escopo
A1	browserSource.ts (lê .txt de um handle) + handleStore.ts (IndexedDB) + detecção de suporte — lógica pura, testável
A2	Tela de onboarding: escolher pasta, com instrução clara de como reconfigurar o PokerStars, e mensagem específica quando a pessoa tenta escolher AppData
A3	Migrar home e replay pra ler do handle · reconexão automática no retorno
A4	Fallback de arrastar arquivos, pra Firefox/Safari
A5	Manifest de PWA (permissão persistente automática + instalar como app)
Uma coisa que vou deixar registrada como débito, não construir agora: com muitas mãos, reparsear tudo a cada visita fica lento. A solução é cachear os Hand[] no IndexedDB com invalidação por file.lastModified — o equivalente cliente do cache por mtime que já temos. Gatilho: quando o carregamento passar de ~2s.

Três coisas que preciso decidir com você antes de começar:

Confirma que topa reconfigurar o PokerStars pra uma pasta fora do AppData? É pré-requisito incontornável.
O fallback de arrastar arquivos entra desde já (A4), ou você quer só o caminho Chrome primeiro e vê depois?
Isso vira Fase 5 do roadmap (empurrando "modo resumido" e "stats" pra frente), ou você quer terminar a Fase 4 (replay) antes?
Sources:

showDirectoryPicker() — MDN
File System Access API — Chrome for Developers
Persistent permissions for the File System Access API — Chrome
chrome_file_system_access_permission_context.cc — Chromium source
PokerStars Setup — Holdem Manager