# FIXO PASS — Painel Web da Empresa + Acesso do Usuário Comum

Frontend estático (HTML/CSS/JS puro, sem build step) que consome a API do `fixopass-backend`.

Quatro páginas independentes, cada uma com seu próprio `apiBase` inline (sem módulo JS
compartilhado, seguindo o padrão "sem build step" do projeto):

- **`index.html`** — painel da empresa (B2B): login, cadastro de empresa
  (`POST /companies`), configuração de campos, unidades/QR Code, integração ERP.
- **`login.html`** — login do usuário comum (B2C): `POST /users/login`. Já logado,
  redireciona direto pra `user-dashboard.html` (sem tela de espera no meio do caminho).
- **`register-user.html`** — cadastro do usuário comum (B2C): `POST /users` (mesmos
  campos que o `mobile-app` envia: `nomeCompleto`, `telefone`, `email`, `cpf`,
  `endereco` opcional, `senha`). Depois de criar a conta, a pessoa faz login normalmente
  (o endpoint de cadastro não devolve sessão, então não dá pra pular esse passo).
- **`user-dashboard.html`** — painel do usuário comum: mesmo padrão visual/estrutural do
  painel da empresa (sidebar + views), só que rodando em cima dos endpoints que o
  `mobile-app` já usa. Tela inicial (padrão):
  - **Escanear QR Code** — abre a câmera do navegador (`getUserMedia`) e decodifica o QR
    Code fixo da empresa em tempo real com **jsQR** (carregado via CDN,
    `cdn.jsdelivr.net/npm/jsqr@1.4.0`, MIT — sem isso a página não teria como decodificar
    frames de vídeo sem um build step). O texto decodificado vira `qrCodeToken` na mesma
    chamada `POST /auth/request` que o app mobile já faz — mesmo contrato, só troca
    câmera do celular por câmera do navegador. Sem câmera/permissão negada/HTTPS
    ausente, cai automaticamente pra um campo de texto (cola o token manualmente, o
    mesmo que aparece em "Copiar token" no painel da empresa) — nunca fica travado.
  - **Empresas autorizadas** (`GET /users/me/autorizacoes`) — histórico de quem recebeu
    dados e quais campos. Cada card tem **"Revogar acesso"**, com modal de confirmação
    (nome da empresa incluso no texto) e `DELETE /users/me/autorizacoes/:companyId` —
    rota que já existia desde a auditoria inicial (soft revoke: `ativo:false` +
    `dataRevogacao`, sem apagar o registro/histórico). O card some da tela na hora, sem
    esperar recarregar a lista inteira.
  - **Meus dados** — nome completo, e-mail, CPF, telefone, RG, data de nascimento
    (`<input type="date">`) e endereço completo (CEP, logradouro, número, complemento,
    bairro, cidade, UF), tudo carregado de `GET /users/me` e editável, salvando via
    `PUT /users/me`. `dataNascimento` vira ISO 8601 completo antes de enviar (o backend
    exige `z.string().datetime()`, o `<input type="date">` só dá `"YYYY-MM-DD"`).
    **Foto de perfil**: avatar + botão "Escolher foto" no topo da aba, upload imediato
    (assim que escolhe o arquivo, sem esperar "Salvar alterações") via `POST
    /users/me/foto` (multipart, campo `foto`) — mesmo padrão de upload que
    `POST /companies/me/logo` já usava (multer em memória → Cloudinary). É essa foto que
    a empresa recebe quando o campo "Foto" está entre os liberados num compartilhamento.
    **Alterar senha**: painel próprio (senha atual + nova + confirmação), chama
    `PUT /users/me/senha`.
    **Controle de compartilhamento por tipo de local**: abas por categoria (Restaurante/
    Pizzaria, Condomínio/Portaria, Hospital/Saúde, Hotel, Loja, Outros, Geral) com
    switches Bloqueado/Liberado pra foto, nome, cpf, rg, data de nascimento, telefone e
    endereço — `email` fica de fora desse controle de propósito. `GET`/`PUT
    /users/me/privacidade`. Isso não é uma segunda aprovação por cima do consentimento
    pontual — é um filtro que roda **antes** da tela de aprovação aparecer: o backend
    já remove de `camposPedidos`, em `POST /auth/request`, qualquer campo que a
    categoria da empresa solicitante não tenha sido liberada pra ver.
    No fim da página, **"Excluir minha conta"** abre um modal de confirmação e chama
    `DELETE /users/me` (implementado no `fixopass-backend`, remove o usuário e em
    cascata suas autorizações/solicitações/logs de acesso). Testado de ponta a ponta
    pelo clique de verdade no modal: exclui, redireciona pra `login.html` com um aviso
    de sucesso, e a conta some do banco (login com o e-mail antigo passa a dar 401).
    Se a rota falhar (backend fora do ar, por exemplo), a tela mostra o erro em vez de
    fingir sucesso — sessão e dados do usuário continuam intactos nesse caso.

  Não há nenhum aviso de "aguarde o app nas lojas" bloqueando a tela — o app mobile
  continua sendo o único jeito de ler NFC de verdade, mas QR Code e edição de perfil já
  funcionam 100% pela web.

  **Nota de teste**: o fluxo completo (`POST /users` → `POST /users/login` →
  `GET /users/me` → `PUT /users/me` → `DELETE /users/me` → `GET /users/me` de novo)
  foi testado direto contra a API de produção da Railway com contas descartáveis
  (e-mail `claude.verify.*@example.com`) pra confirmar os nomes de campo e que tanto a
  edição quanto a exclusão persistem de verdade. Nenhuma conta de teste de **usuário**
  ficou no banco — todas foram removidas via o próprio `DELETE /users/me` depois de
  usadas. Também reparei que um `GET /users/me` feito *imediatamente* após o `PUT` pode
  devolver o valor antigo por alguns segundos (cache/replicação com lag no backend); a
  tela não sofre com isso porque usa a resposta do próprio `PUT` pra atualizar a UI, sem
  depender de um `GET` seguinte.

  **Nota de teste (foto + tela do lojista)**: testado o fluxo inteiro de ponta a ponta —
  upload de foto (`POST /users/me/foto`) → usuário "lê" o QR Code de uma unidade de
  teste (`POST /auth/request`) → aprova liberando NOME + TELEFONE + FOTO
  (`POST /customer/share`) → a empresa consulta `GET /companies/me/compartilhamentos` e
  a foto aparece, tanto na chamada crua quanto renderizada na nova view
  "Compartilhamentos recebidos" do `index.html` (`<img>` carregando de verdade, testado
  via `naturalWidth`/`naturalHeight`). Também testei o upload de foto pela UI de
  verdade em `user-dashboard.html` (evento `change` real no `<input type="file">`, sem
  pular pro `apiUpload` direto). A conta de usuário usada nesse teste foi excluída pelo
  `DELETE /users/me` depois; a empresa de teste foi **encerrada** (não excluída — ver
  seção "Encerrar conta" abaixo) pelo `DELETE /companies/me`, que passou a existir logo
  em seguida.

  **Nota de teste (campos completos + privacidade por categoria)**: testado contra
  produção com 1 usuário e 3 empresas descartáveis, uma por categoria (Restaurante,
  Hospital, Loja). Salvei RG, data de nascimento e endereço estruturado completos
  (`PUT /users/me`), troquei a senha (`PUT /users/me/senha`, confirmando que login com
  a senha antiga passa a dar 401), e configurei regras de privacidade diferentes por
  categoria (`PUT /users/me/privacidade`). Depois simulei os 3 cenários que a feature
  precisa cobrir, todos via `POST /auth/request` de verdade:
  - Empresa **Restaurante** pedindo NOME+CPF+TELEFONE+ENDERECO, usuário só liberou
    NOME+TELEFONE pra essa categoria → `camposPedidos` voltou só com `["NOME","TELEFONE"]`.
  - Empresa **Hospital** pedindo NOME+CPF+RG+DATA_NASCIMENTO+ENDERECO, usuário liberou
    tudo isso pra Hospital → os 5 campos passaram, nada filtrado.
  - Empresa **Loja** pedindo NOME+CPF, usuário **sem nenhuma regra configurada** pra
    Loja nem GERAL → passou tudo sem filtro, confirmando que quem nunca mexeu nisso não
    é afetado.
  Depois liberei CPF pra Restaurante **pela UI de verdade** (clique no toggle + botão
  Salvar em `user-dashboard.html`) e reescaneei o QR da mesma empresa: `camposPedidos`
  passou a incluir CPF, fechando o ciclo completo UI → API → filtro aplicado.
  Um detalhe que vale registrar: no meio do teste, usar `curl` com acento (ex.: "São
  Paulo") direto num argumento de linha de comando neste ambiente Windows/Git Bash
  corrompeu o caractere antes mesmo de sair da minha máquina (virou U+FFFD) — não é bug
  do backend nem do frontend. Confirmei isso testando o mesmo campo pela UI de verdade
  (`fetch`/`JSON.stringify` no navegador): "José", "São Paulo" e afins vão e voltam com
  os *code points* certos (`é`=233, `ã`=227, `ú`=250). Só usar `curl` com acento em
  argumento de linha de comando neste ambiente que não é confiável.

  **Nota de investigação (relato de "Salvar alterações não funciona" em produção)**:
  não consegui reproduzir. Testei direto em `https://fixopass-painel-web.vercel.app`
  (não num espelho local) com uma conta descartável: confirmei que o arquivo publicado
  já tinha o código mais recente (`fetch` com `cache: 'no-store'` + checagem de
  `x-vercel-cache`), logei pela tela de verdade, preenchi RG/data de
  nascimento/endereço completo em "Meus dados" e **cliquei no botão de verdade** (não
  chamei a função por JS) — deu toast de sucesso, e uma consulta direta à API alguns
  segundos depois confirmou que os dados persistiram corretamente. CORS também não é o
  problema (o próprio teste passou pelo preflight `OPTIONS` + `PUT` com o header
  `X-USER-ID` sem erro). Minha hipótese mais provável pro que a pessoa viu: o
  `GET /users/me` feito logo depois de um `PUT` pode devolver o valor antigo por alguns
  segundos (cache/replicação com lag no backend, já registrado antes nesta seção) — se
  ela salvou e deu F5 rápido demais, ia parecer que nada mudou, mesmo tendo salvo.
  Adicionei `console.log`/`console.error` em `api()`/`apiUpload()` (payload enviado,
  status e corpo da resposta, e uma mensagem clara pra falha de rede de verdade
  separada de erro HTTP) — não porque achei o bug, mas pra dar visibilidade real da
  próxima vez que alguém reportar isso, incluindo o navegador/passo a passo exato.

Todas as três telas de entrada (`index.html`, `login.html`, `register-user.html`) têm o
mesmo seletor de perfil no topo do formulário — `[ Sou Cliente ] | [ Sou Empresa ]` —
pra deixar óbvio pra quem chegou na página errada onde clicar, sem precisar ler nada.

## Como rodar

1. Suba a API do backend primeiro (veja o README do `fixopass-backend`), rodando por padrão em `http://localhost:3000`.
2. Abra o `index.html` direto no navegador (duplo clique) — ou sirva com qualquer servidor estático:

```bash
npx serve .
# ou
python3 -m http.server 5500
```

3. Se a API estiver em outro endereço, ajuste o campo **"Endereço da API"** na tela de login (fica salvo no navegador).

## O que dá pra fazer

- Cadastrar a empresa (mostra a API Key **uma única vez** — copie e guarde para configurar no ERP).
- Login do painel (usa e-mail/senha, diferente da API Key do ERP).
- Ver visão geral da conta (categoria, quantidade de campos configurados, quantidade de unidades).
- Configurar quais campos a empresa solicita (Bloqueado / Liberado / Obrigatório) por campo.
- Criar unidades e ver o QR Code de cada uma (pronto para imprimir).
- Copiar o token de uma unidade para gravar numa etiqueta NFC física (ver seção abaixo).
- **Compartilhamentos recebidos** — a "tela do lojista": o que apareceu quando um
  cliente aproximou o NFC ou leu o QR Code, com nome/telefone/e-mail/CPF (o que tiver
  sido liberado) e a **foto do cliente**, se o campo "Foto" estava entre os liberados.
  Puxa de `GET /companies/me/compartilhamentos` (50 mais recentes, sem paginação por
  ora). Antes desse endpoint, essa informação só existia via webhook/polling do
  próprio ERP da empresa — não tinha nenhum jeito de ver isso direto no painel web.
- **Encerrar conta da empresa** — seção vermelha no fim da "Visão geral" (mesma tela de
  "Dados da empresa"), com modal de confirmação explicando que o acesso ao painel, a API
  Key e o NFC/QR Code de todas as unidades param de funcionar imediatamente. Chama
  `DELETE /companies/me`, que é **soft delete** (`ativa = false`) — bem diferente de
  `DELETE /users/me` (exclusão definitiva). Depois de encerrada, a empresa não consegue
  reabrir a conta sozinha; login (`POST /companies/login`) passa a rejeitar mesmo com
  senha certa. Redireciona pra `/app?conta-encerrada=1`, que mostra um aviso de sucesso
  na tela de login. Testado de ponta a ponta com uma conta descartável: clique real no
  modal → confirmei via API que login, API Key e leitura de QR Code de uma unidade dela
  passam a falhar logo em seguida (login com `401 "Esta conta foi encerrada."`, API Key
  com `401`, QR Code com `404` — mesma mensagem de QR inválido, pra não vazar que a
  empresa existiu).

## Deixando o NFC funcionando de verdade (passo operacional, fora do software)

O FIXO PASS não grava a etiqueta NFC pra você — isso é um passo físico único por unidade:

1. Compre etiquetas NFC em branco (tipo NTAG213/215/216, fáceis de achar em qualquer loja online).
2. No painel, clique **"Copiar token"** na unidade desejada.
3. Use um app gravador de NFC no celular (ex.: **NFC Tools**, grátis na Play Store/App Store)
   para gravar esse token como um **registro de texto (NDEF Text Record)** na etiqueta.
4. Cole a etiqueta no balcão/recepção da unidade.

O app do usuário lê esse mesmo token tanto por QR Code quanto por NFC — é o mesmo
identificador dos dois jeitos, então não precisa gravar nada diferente.

## Limitações do MVP

- Sessão simplificada via `X-COMPANY-ID` guardado no navegador (`localStorage`) — trocar por cookie de sessão/JWT quando o backend tiver autenticação real.
- Sem paginação nem busca nas listas — ok para o volume de um piloto, revisar antes de escalar.
- Sem tela de logs/auditoria ainda (o backend já grava tudo em `LogAcesso`, só falta expor um endpoint de leitura e essa tela aqui).

## Changelog da auditoria de código

- **Segurança**: a função `escapeHtml` só escapava aspas simples (pra não quebrar `onclick="..."`), não fazia escape de HTML de verdade. Nome/endereço de unidade, CNPJ e e-mail (texto livre da própria empresa) eram inseridos via `innerHTML` sem escape — um valor com `<` ou `"` quebrava a página. Corrigido: escape de HTML correto + troca de `onclick` inline por delegação de eventos (mais seguro por natureza, elimina o problema pela raiz).
