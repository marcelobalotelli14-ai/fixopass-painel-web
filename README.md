# FIXO PASS — Landing Page

Página pública de marketing (HTML/CSS/JS puro, sem build step), com dois públicos na
mesma página: empresas (venda B2B) e usuários finais. Também funciona como PWA
instalável (manifest + service worker).

## Como rodar

Abra o `index.html` direto no navegador, ou sirva com qualquer servidor estático:

```bash
npx serve .
```

## Deploy (Vercel)

Site estático puro — sem build step. `vercel.json` fixa `Cache-Control: no-cache` em
`sw.js` e `manifest.json` para que o Service Worker nunca fique "preso" servindo uma
versão antiga depois de um novo deploy (o `sw.js` já usa estratégia network-first para
o HTML, cache-first só para os assets estáticos).

## Header: dois públicos, dois fluxos

O header separa claramente os dois perfis que a landing atende:

- **Usuário comum (B2C)** — botões "Entrar" e "Criar conta" no topo (destaque), levando
  para `/app/login.html` e `/app/register-user.html`. Essas páginas conversam direto com
  o backend da Railway (`POST /users/login` e `POST /users`, o mesmo contrato já usado
  pelo `mobile-app`), sem passar pelo painel de empresa.
- **Empresa (B2B)** — link secundário "Sou empresa" no header (menor, à esquerda dos
  botões de usuário) e, no mobile, dentro do menu hambúrguer. Leva para `/app`, o painel
  da empresa (`app/index.html`), com login e cadastro (`/app?cadastro=empresa`) nele
  mesmo. Também aparece em destaque nas seções "Para empresas" da própria página.

## O que ainda precisa ser conectado

- **"Baixar o app"** → os selos da App Store / Google Play seguem "Em breve" — apontar
  para as lojas de verdade depois que o `mobile-app` tiver uma build publicada (hoje só
  roda via Expo Go/development build). Enquanto isso, `/app/register-user.html` já deixa
  a pessoa criar a conta pela web.
- **"Termos de uso" / "Privacidade"** → o rodapé aponta para `termos.html` /
  `privacidade.html`, mas são rascunhos sem revisão jurídica (banner "rascunho" nas
  próprias páginas). A versão final ainda é um item pendente antes do piloto real, por
  causa de CPF/RG/dados de saúde (ver `CHECKLIST-PILOTO.md` do backend).

## Identidade visual

Fundo `#0f141c`, cards em `#181f2a`/`#202936`, bordas `#283344`, acento âmbar `#e5a138`.
Hero com imagem 3D (`hero-fixopass.png`), seção "Para você" com `mobile-pass.png`, logo
oficial (`logo-fixopass.png`) no header/footer via `mix-blend-mode: screen` (o arquivo
tem fundo preto sólido, não transparente). Layout em bento grid nas seções "Como
funciona" e "Para empresas". Splash screen animada (`#preloader`) ao carregar a página.

Duas versões anteriores ficaram salvas para referência/comparação:
`index-v1-ink-amber-backup.html` e, no histórico do git, a versão só-CSS/SVG sem imagens
(commit anterior a este).

## PWA

`manifest.json` + `sw.js` + ícones (`icon-192.png`, `icon-512.png`,
`apple-touch-icon.png`, todos gerados a partir de `logo-fixopass.png`). O service worker
faz cache offline dos assets estáticos; requisições de navegação (HTML) sempre vão pra
rede primeiro, pra qualquer deploy novo aparecer na hora.
