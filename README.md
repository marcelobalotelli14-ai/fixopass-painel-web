# FIXO PASS — Landing Page

Página pública de marketing (HTML/CSS puro, sem build step), com dois públicos na mesma
página: empresas (venda B2B) e usuários finais.

## Como rodar

Abra o `index.html` direto no navegador, ou sirva com qualquer servidor estático:

```bash
npx serve .
```

## O que ainda precisa ser conectado (links são placeholders `#` por enquanto)

- **"Cadastrar empresa" / "Entrar"** → apontar para a URL real do `fixopass-painel-web`
  depois que ele estiver hospedado (hoje ele também roda local, sem domínio público).
- **"Baixar o app"** → apontar para a App Store / Google Play depois que o `fixopass-app`
  tiver uma build publicada (hoje ele só roda via Expo Go/development build).
- **"Termos de uso" / "Privacidade"** → ainda não existem (ver `CHECKLIST-PILOTO.md` do
  backend — é um item pendente antes do piloto real, por causa de CPF/RG/dados de saúde).

## Identidade visual

Preto + verde neon, em layout tipo "bento grid" (baseado em referência visual aprovada):
celular-a-celular mostrando o fluxo NFC/QR no centro, coluna "Para você" à esquerda,
coluna "Para sua empresa" + painel/API + preço à direita, faixa de passos abaixo, e faixa
de benefícios fechando a seção principal. Tudo em SVG/CSS — sem imagens externas, então
carrega rápido e escala em qualquer tamanho de tela.

A versão anterior (tinta profunda + âmbar, mesma linha do painel web) ficou salva em
`index-v1-ink-amber-backup.html`, caso queira comparar ou voltar atrás.

## Changelog da auditoria de código

Revisão completa: HTML validado (tags balanceadas, sem IDs duplicados, sem âncoras
quebradas) e CSS validado (chaves balanceadas, todas as variáveis usadas estão definidas).
Nenhum bug encontrado — a página não depende de JavaScript, o que reduz bastante a
superfície de erro.
