# FIXO PASS — App do Usuário (Expo / React Native)

App mobile que fecha o item 5/6 do roadmap do lado do usuário: cadastro, login, leitura de
QR Code e tela de autorização (aceitar/negar compartilhamento).

## Telas

- **Login / Cadastro** — usa `POST /users/login` e `POST /users` do backend.
- **Home** — saudação, dois botões ("Aproximar NFC" e "Ler QR Code") e lista de
  "Empresas autorizadas" (`GET /users/me/autorizacoes`).
- **NFC** — inicia a leitura NFC nativa (`react-native-nfc-manager`), lê o token gravado na
  etiqueta física da empresa e chama `POST /auth/request` com `metodo: "NFC"`.
- **Scanner (QR)** — abre a câmera, lê o QR Code da unidade e chama `POST /auth/request`
  com `metodo: "QRCODE"`.
- **Autorização** — mostra "A empresa X solicita acesso aos seus dados", lista os campos
  pedidos, e chama `POST /customer/share` com `aprovar: true/false`. Pode ser aberta tanto
  pelo Scanner/NFC quanto ao tocar numa push notification.

O app registra o Expo Push Token no backend logo após o login (`PUT /users/me/push-token`).
Isso é usado quando **a empresa/terminal** (não o próprio usuário) cria uma solicitação
identificando o cliente por CPF — nesse caso o celular do usuário recebe uma notificação, e
tocar nela abre a tela de autorização direto (busca os detalhes em `GET /auth/request/:id`).

NFC e QR Code usam exatamente o mesmo campo (`qrCodeToken`) pro backend resolver a empresa/
unidade — são só duas formas físicas diferentes de entregar o mesmo token. Isso já estava
implementado no backend; a etiqueta NFC é gravada com o mesmo valor exibido no QR Code
(ver `fixopass-painel-web`, botão "Copiar token").

## ⚠️ Importante: NFC exige um build nativo, não roda no Expo Go

`react-native-nfc-manager` é um módulo nativo — o app Expo Go (o app genérico da loja) **não
consegue rodar código de NFC**, porque ele só carrega apps que usam os módulos que já vêm
prontos dentro dele. Pra testar o NFC de verdade, você precisa gerar um build próprio do app
(chamado de "development build"):

```bash
npm install

# Gera os projetos nativos android/ e ios/ a partir da configuração do app.json
npx expo prebuild

# Opção A — build local (precisa do Android Studio instalado)
npx expo run:android

# Opção B — build na nuvem via EAS (não precisa instalar Android Studio/Xcode)
npx eas login
npx eas build --profile development --platform android
```

Depois de instalado esse build no celular (uma vez só), o fluxo normal de desenvolvimento
continua com `npx expo start` — só que agora abrindo esse app próprio em vez do Expo Go.

**No iOS**, NFC de leitura (Core NFC) exige: iPhone 7 ou mais novo, iOS 13+, e uma conta
Apple Developer (paga, US$99/ano) pra habilitar a capability NFC no provisionamento —
não tem como testar isso no simulador, só em aparelho físico.

**No Android**, funciona em qualquer aparelho com chip NFC (a grande maioria dos
intermediários/topo de linha desde ~2016), também só em aparelho físico — emuladores não
simulam hardware NFC.

## Como rodar (QR Code funciona até no Expo Go, se preferir testar isso primeiro)

```bash
npm install
npx expo start
```

Escaneie o QR Code que aparece no terminal com o app Expo Go, ou pressione `a`/`i` pra abrir
num emulador. **A tela de NFC vai dar erro no Expo Go** (módulo nativo ausente) — use o
development build acima pra testar essa parte.

### Apontando para o backend

Por padrão, o app tenta falar com `http://localhost:3000`. Isso **não funciona num celular
físico** (localhost ali é o próprio celular, não o seu computador). Duas opções:

1. **Testando no emulador Android**: acessa a máquina host via `10.0.2.2` no lugar de
   `localhost`.
2. **Testando no celular físico** (necessário para NFC): rode o backend numa máquina
   acessível pela rede (ex.: `http://192.168.0.x:3000`), ou suba num serviço como
   Railway/Render e use a URL pública.

Toque em "Servidor ⚙" na tela de login para digitar o endereço direto no app (fica salvo
no `AsyncStorage`, não precisa editar código nem gerar novo build para trocar).

## O que ainda falta

- **Sessão simplificada** — o `userId` fica salvo no `AsyncStorage` sem token/expiração,
  igual ao painel web. Precisa virar JWT antes de qualquer piloto real (ver
  `CHECKLIST-PILOTO.md` do backend).
- **Push notification em Expo Go pode não funcionar dependendo da versão/SDK** — como o
  app já precisa de development build por causa do NFC, teste push também nesse build, não
  no Expo Go, pra não confundir "não funciona por causa do Expo Go" com "não funciona de
  verdade".
- **Não testamos este projeto rodando de verdade** — o ambiente onde ele foi gerado não tem
  acesso à internet, dispositivo físico nem Android Studio/Xcode. O código segue a API real
  do backend e a documentação oficial do `react-native-nfc-manager`, mas o primeiro build
  de verdade (`expo prebuild` + `eas build`) é o teste definitivo, e pode expor ajustes
  necessários — principalmente em como o Android trata o "modo de escuta" de NFC quando o
  app está em segundo plano.

## Estrutura

```
App.tsx                        → navegação (login/cadastro vs. app logado)
src/
  api/client.ts                → fetch wrapper + endereço configurável da API
  context/AuthContext.tsx      → sessão do usuário (MVP: userId no AsyncStorage)
  theme/theme.ts                → mesma identidade visual do painel web
  screens/
    LoginScreen.tsx
    CadastroScreen.tsx
    HomeScreen.tsx              → perfil + empresas autorizadas
    ScannerScreen.tsx           → leitura do QR Code
    NfcScannerScreen.tsx        → leitura NFC (requer development build, ver acima)
    AutorizacaoScreen.tsx       → aceitar/negar o compartilhamento
```

## Changelog da auditoria de código

- **Bug de configuração (grave para iOS)**: `app.json` tinha uma chave `infoPlistNSCameraUsageDescription` que **não existe** no schema do Expo — a descrição de uso da câmera nunca seria aplicada de verdade no Info.plist, o que causa erro/crash no iOS ao pedir permissão de câmera sem essa string configurada. Corrigido: movida para dentro de `ios.infoPlist.NSCameraUsageDescription`, junto com a de NFC.
- **Funcionalidade ausente**: `setApiBase` existia em `src/api/client.ts` mas nunca era chamado em nenhuma tela — não tinha como testar em celular físico sem editar código-fonte e gerar novo build. Adicionado um campo "Servidor" (colapsável) na tela de login pra configurar isso direto no app.
- **UX — falha silenciosa**: em `AutorizacaoScreen`, se `POST /customer/share` falhasse, nada era mostrado — a tela só voltava ao normal sem explicação. Adicionado estado de erro visível.
- **Robustez**: `AuthContext` não tinha `.catch()` ao ler o `AsyncStorage` — uma falha ali (ou um JSON corrompido salvo) travava o app no spinner de carregamento pra sempre. Corrigido.
- Limpeza: `CadastroScreen` espalhava a prop `label` (que não existe no `TextInput` nativo) direto no componente via `{...props}`.
- Removida pasta fantasma `src/{screens,api,context,theme}` (resíduo de um comando de shell antigo).
