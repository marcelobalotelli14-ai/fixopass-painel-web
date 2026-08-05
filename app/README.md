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
    dados e quais campos.
  - **Meus dados** — nome completo, e-mail, CPF e telefone, carregados de
    `GET /users/me` e editáveis, salvando via `PUT /users/me` ("Usuário edita seus
    próprios dados" — endpoint real, achado e confirmado direto no Swagger do backend em
    `/docs`, não documentado no `mobile-app`). RG, data de nascimento, endereço e senha
    ainda não têm campo de edição aqui (dá pra adicionar depois, o endpoint aceita).
    No fim da página, **"Excluir minha conta"** abre um modal de confirmação e chama
    `DELETE /users/me` — **essa rota não existe no backend ainda** (só existe
    `DELETE /users/me/autorizacoes/{companyId}`, que revoga uma autorização, não a conta
    inteira). O botão já está pronto pro dia que o backend implementar; até lá, o clique
    dá 404 e a tela mostra um aviso explicando isso (sem parecer erro genérico) em vez de
    fingir que funcionou. **Isso precisa ser implementado no repositório do
    `fixopass-backend`** — não dá pra fazer esse lado no `fixopass-painel-web` (é só
    frontend estático, sem acesso ao código ou ao banco do backend). Spec sugerida:

    ```
    DELETE /users/me
    Header: X-USER-ID: <uuid do usuário>  (mesmo padrão de auth já usado em GET/PUT /users/me)
    200 -> apaga o usuário e, em cascata, LogAcesso/autorizações/solicitações ligadas a ele
    404 -> X-USER-ID não corresponde a um usuário existente
    ```

  Não há nenhum aviso de "aguarde o app nas lojas" bloqueando a tela — o app mobile
  continua sendo o único jeito de ler NFC de verdade, mas QR Code e edição de perfil já
  funcionam 100% pela web.

  **Nota de teste**: o fluxo completo (`POST /users` → `POST /users/login` →
  `GET /users/me` → `PUT /users/me` → `GET /users/me` de novo) foi testado direto contra
  a API de produção da Railway com uma conta descartável (`TESTE VERIFICACAO CLAUDE...`,
  e-mail `claude.verify.*@example.com`) pra confirmar os nomes de campo e que a alteração
  persiste de verdade. Não existe endpoint de exclusão de usuário na API hoje, então essa
  conta de teste continua no banco — considerar removê-la manualmente. Também reparei que
  um `GET /users/me` feito *imediatamente* após o `PUT` pode devolver o valor antigo por
  alguns segundos (cache/replicação com lag no backend); a tela não sofre com isso porque
  usa a resposta do próprio `PUT` pra atualizar a UI, sem depender de um `GET` seguinte.

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
- Sem exclusão de conta de verdade ainda (exigência de LGPD) — o botão existe em
  `user-dashboard.html`, mas depende de `DELETE /users/me` ser implementado no
  `fixopass-backend` primeiro (ver spec na seção acima). A conta de teste
  `claude.verify.*@example.com` continua no banco de produção por causa disso.

## Changelog da auditoria de código

- **Segurança**: a função `escapeHtml` só escapava aspas simples (pra não quebrar `onclick="..."`), não fazia escape de HTML de verdade. Nome/endereço de unidade, CNPJ e e-mail (texto livre da própria empresa) eram inseridos via `innerHTML` sem escape — um valor com `<` ou `"` quebrava a página. Corrigido: escape de HTML correto + troca de `onclick` inline por delegação de eventos (mais seguro por natureza, elimina o problema pela raiz).
