# FIXO PASS — Painel Web da Empresa + Acesso do Usuário Comum

Frontend estático (HTML/CSS/JS puro, sem build step) que consome a API do `fixopass-backend`.

Três páginas independentes, cada uma com seu próprio `apiBase` inline (sem módulo JS
compartilhado, seguindo o padrão "sem build step" do projeto):

- **`index.html`** — painel da empresa (B2B): login, cadastro de empresa
  (`POST /companies`), configuração de campos, unidades/QR Code, integração ERP.
- **`login.html`** — login do usuário comum (B2C): `POST /users/login`.
- **`register-user.html`** — cadastro do usuário comum (B2C): `POST /users` (mesmos
  campos que o `mobile-app` envia: `nomeCompleto`, `telefone`, `email`, `cpf`,
  `endereco` opcional, `senha`).

O usuário comum não tem um painel completo aqui (isso é o `mobile-app` — NFC/QR Code,
histórico de compartilhamentos etc.); `login.html`/`register-user.html` existem só para
não deixar a landing page sem um lugar funcional para criar conta enquanto o app não
está publicado nas lojas.

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

## Changelog da auditoria de código

- **Segurança**: a função `escapeHtml` só escapava aspas simples (pra não quebrar `onclick="..."`), não fazia escape de HTML de verdade. Nome/endereço de unidade, CNPJ e e-mail (texto livre da própria empresa) eram inseridos via `innerHTML` sem escape — um valor com `<` ou `"` quebrava a página. Corrigido: escape de HTML correto + troca de `onclick` inline por delegação de eventos (mais seguro por natureza, elimina o problema pela raiz).
