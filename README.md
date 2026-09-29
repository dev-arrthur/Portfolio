# Arthur Ferreira · Portfólio 2.1

Nova versão em **Node.js, TypeScript e Next.js**, preparada para Vercel, com painel administrativo e armazenamento persistente em MongoDB.

## O que mudou

- Nova apresentação responsiva, tema claro artístico inspirado no portfólio original, assinatura Arthur F., ilustrações originais, tipografia local e animações que respeitam a preferência de movimento reduzido.
- Dez projetos com descrição, status, filtros e detalhes: Página de Carreiras, App de Vantagens e Benefícios, Cobrança de Documentos, Sistema de Acompanhamento, thynkBarber, WhatsApp Multichannel, RedeMG Farma, Recrie, Sistema de Cobranças e thynkXP.
- thynkBarber em destaque: mais de 7 barbearias, mais de 1.500 agendamentos, mais de 3 mil usuários e faturamento médio mensal de R$ 2.900. Números fornecidos pelo responsável em setembro/2026; não são uma consulta em tempo real.
- Comunidade dev em formação, com contato pelo WhatsApp para manifestar interesse.
- Instagram `hey.arrthur`, LinkedIn atualizado, WhatsApp, GitHub e e-mail.
- Currículo no rodapé e no canto inferior direito. Até enviar o PDF, os botões indicam a indisponibilidade.
- Painel `/admin`: login, indicadores de 7/30/90 dias, gráfico, cliques por elemento, origens, dispositivos, localização aproximada, atividade recente, exportação CSV e gestão do PDF.

Os arquivos HTML anteriores foram preservados na raiz para manter a referência histórica e o GitHub Pages atual. A aplicação nova está em `src/` e deve ser executada na Vercel. `/links.html` na nova aplicação redireciona ao contato.

## Rodar localmente

Use Node.js 24 LTS e npm.

```bash
npm ci
cp .env.example .env.local
npm run password:hash
npm run dev
```

No Windows, copie `.env.example` para `.env.local` pelo explorador ou com `Copy-Item`. O gerador solicita a senha e fornece um hash. Use a senha escolhida para o painel. Nunca coloque a senha no código nem em uma variável `NEXT_PUBLIC_`.

Preencha `ADMIN_PASSWORD_HASH` com o hash e `SESSION_SECRET` com um segredo aleatório. Para testar sem MongoDB, use `STORAGE_DRIVER=local`: os dados ficam em `.data/`, fora do Git. **Esse modo é exclusivo de desenvolvimento** e é recusado na Vercel e em produção. Não existe preenchimento de métricas demonstrativas.

Gere um segredo de sessão:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Abra `http://localhost:3000` e `http://localhost:3000/admin`.

## Publicar na Vercel

1. Importe este repositório e selecione a branch com a versão 2.0, ou faça o merge do pull request antes. Root Directory: raiz; Framework: Next.js; Node.js: 24.x.
2. Conecte um MongoDB persistente e configure as variáveis abaixo. Use um usuário limitado ao banco do portfólio e acesso de rede compatível com a hospedagem.
3. Faça o deploy. O build não precisa de acesso ao banco; as funcionalidades administrativas precisam das variáveis corretas em execução.
4. Em Settings → Domains, adicione o domínio e configure os registros DNS indicados pela Vercel. Ajuste `NEXT_PUBLIC_SITE_URL` para o domínio final e faça novo deploy.
5. Acesse `/admin`, entre com a senha usada no gerador e envie o PDF. Os botões públicos passam a disponibilizar o arquivo após atualizar a página.

| Variável | Valor |
| --- | --- |
| `MONGODB_URI` | URI do MongoDB. Obrigatória em produção. |
| `MONGODB_DB` | `arthur_portfolio` ou outro nome escolhido. |
| `STORAGE_DRIVER` | `mongodb` em produção. |
| `ADMIN_PASSWORD_HASH` | Hash de `npm run password:hash` no formato `scrypt:salt:hash`. |
| `SESSION_SECRET` | Segredo aleatório com pelo menos 32 caracteres. |
| `NEXT_PUBLIC_SITE_URL` | URL final com `https://`, sem barra no fim. |

Configure Production e, se desejado, Preview. Use bancos separados entre produção e prévias para não misturar testes e visitas reais. Trocar o hash ou o segredo invalida sessões anteriores. O logout revoga a sessão no banco.

## Currículo

- Apenas PDF, até **3 MB**.
- Envio autenticado, validação de tamanho, MIME e assinatura `%PDF-`.
- Binário no MongoDB; atualização substitui o anterior atomicamente.
- O currículo fica público após o envio; publique somente o que deseja compartilhar.
- Download com `Content-Disposition: attachment` e nome sanitizado.
- O arquivo não vai ao GitHub nem depende do disco temporário da Vercel.
- A consulta pública de disponibilidade retorna apenas metadados.

## Como ler os indicadores

- **Visitas**: carregamentos da página inicial com consentimento; recargas podem aumentar o total.
- **Visitantes**: estimativa por identificador aleatório no navegador, válido por até 90 dias. Não identifica pessoas nem oferece contagem exata de pessoas distintas.
- **Cliques**: ações instrumentadas nos projetos, navegação, contatos e botões. Não é mapa de calor com coordenadas do mouse.
- **Downloads**: respostas que entregam o PDF, sem confirmar salvamento ou leitura. Downloads do painel não entram na contagem.
- **Origens**: domínio referenciador quando disponibilizado pelo navegador; ausência aparece como acesso direto.
- **Localização**: país/cidade aproximados da Vercel quando disponíveis. Não usa GPS e não inventa localização em desenvolvimento.
- **Períodos**: 7, 30 ou 90 dias. Eventos expiram após 90 dias; o MongoDB remove os expirados por índice TTL.

Visitas e cliques dependem da escolha do visitante e respeitam `Do Not Track`. Downloads são também uma contagem operacional: sem consentimento, são registrados sem identificador, dispositivo ou localização. A preferência pode ser alterada em “Privacidade”. O painel começa vazio e recebe dados do uso.

## Segurança e operação

- Senha com scrypt; sessão assinada e persistida, cookie HttpOnly/SameSite Strict, Secure em produção e duração de 8 horas.
- Verificação de origem nas escritas, validação e limites de payload.
- Limites persistentes para login e coleta de eventos. IP bruto não é armazenado; os limites usam HMAC temporário.
- APIs administrativas protegidas; `/admin` e `/api/` excluídos da indexação.
- CSV com neutralização de células interpretáveis como fórmulas.
- Segredos fora do Git, do JavaScript público e das mensagens de erro.
- Falta de configuração não derruba a apresentação pública; o painel informa a pendência e não simula dados.
- O armazenamento local serve para desenvolvimento e não substitui a validação com MongoDB de produção.

## Manutenção

| Arquivo | Conteúdo |
| --- | --- |
| `src/lib/content.ts` | Projetos, textos e contatos. |
| `src/components/portfolio.tsx` / `.css` | Experiência pública. |
| `src/components/admin.tsx` / `.css` | Painel administrativo. |
| `src/components/analytics-consent.tsx` | Preferência e captura de cliques. |
| `src/lib/server/` | Autenticação, armazenamento e métricas. |
| `src/app/api/` | Endpoints. |
| `public/images/workspace-illustration.webp` / `creative-process.webp` | Ilustrações do portfólio original, otimizadas em WebP. |

```bash
npm run typecheck
npm test
npm run build
npx playwright install chromium
npx playwright test
```

GitHub Actions executa essas validações em pull requests e pushes na main, incluindo os fluxos no Chromium e capturas de tela de desktop, mobile e admin. O teste de navegador usa um servidor local isolado, senha exclusiva de teste e dados descartáveis. Ele não usa credenciais de produção. Os resultados do thynkBarber e status dos projetos são editoriais: atualize `content.ts` conforme necessário. O domínio é configurável, sem endereço de produção inventado.

## Versão e progresso

**2.1.0 · setembro/2026** — tema claro editorial, assinatura do portfólio original, ilustrações preservadas e otimizadas, navegação completa e painel administrativo claro. Mantém dez projetos, destaque da comunidade, métricas e gestão do currículo.

**2.0.0 · setembro/2026** — reconstrução da aplicação em Next.js, autenticação, MongoDB, documentação e configuração para Vercel.

Para ativação pública: importar na Vercel, preencher variáveis, conectar MongoDB, vincular o domínio e enviar o PDF definitivo.
