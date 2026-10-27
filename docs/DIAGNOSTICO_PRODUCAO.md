# Diagnóstico de produção — Render e Vercel

Diagnóstico: 26/10/2026, America/Sao_Paulo. Revisão em 27/10/2026: commits locais autorizados, separados por repositório; push, deploy e migrations em produção continuam sem autorização e não foram executados.

## Evidências atuais

- O usuário confirmou Render no repositório `guilhermeguerradev/acao-social-backend`, branch `main`, SHA `3d7232b2dffb9117671d7ff2242cb2c8b98bc2f7`, build `npm ci && npm run build` e start `npm start`. A investigação não voltou a assumir repositório incorreto.
- GET público `/health`: 200, `{"status":"healthy"}`. Esse endpoint não consulta o banco e não comprova conectividade ou migrations.
- GET público `/demandas/options`, `/demandas?page=1` e `/consultas?limit=1`, sem Authorization: 401, `Token nao fornecido`. O módulo de demandas está montado; o 404 anterior não foi reproduzido.
- CORS permite `https://acao-social-frontend.vercel.app`.
- O asset atual da Vercel `/assets/index-D5e7Wowx.js` contém a base `https://acao-social-backend-3obx.onrender.com`, sem `/api` ou barra final. Não é necessário mudar essa URL.
- Não há `render.yaml` ou `vercel.json` no repositório. Build/start do backend, Prisma schema e registro das rotas em `src/` e `dist/` foram conferidos.

## HTTP 500 de demandas: o que foi e não foi confirmado

A causa exata do 500 em produção **continua pendente de evidência**: não houve acesso ao banco de produção, a uma sessão autenticada de produção ou aos logs privados do Render. Não foram solicitadas credenciais, tokens ou a URL privada do banco. A ausência de `migrate deploy` no build não prova que as migrations estejam pendentes: elas podem ter sido aplicadas por outra etapa.

A consulta atual aceita `page=1`, usa paginação no banco e seleciona os 15 campos de `Demand`, além de `requester.id/name`. Com schema consistente ela passa nos testes PostgreSQL reais, inclusive para médico, instrutor e usuário comum. Não foi identificado defeito de filtro/paginação que explique sozinho esse GET em produção.

Possibilidades a distinguir pelo log: relação ausente (Prisma P2021 / PostgreSQL 42P01), coluna ausente (P2022 / 42703), enum incompatível, schema incorreto, permissão negada (42501), falha de conexão/TLS, limite de conexões ou outro erro do driver. O código seleciona campos novos mesmo nas demandas antigas; uma coluna ainda ausente pode quebrar a listagem independentemente de a tabela estar vazia.

## Verificação segura prioritária no Render

No **Shell do próprio Web Service**, na raiz que contém `prisma.config.ts` e usando o ambiente já configurado do serviço:

```sh
npx prisma migrate status
```

Esse comando compara os arquivos com `_prisma_migrations`; não aplica migrations. Use a CLI instalada pelo lockfile. Não altere `DATABASE_URL` durante essa conferência e não compartilhe a linha de conexão que a CLI possa apresentar; envie somente os nomes/estados das migrations e erros sanitizados. Se o plano não disponibilizar Shell, execute em um ambiente administrativo confiável com a mesma revisão e a conexão de produção configurada privadamente. A conexão interna do Render pode não funcionar fora da rede do serviço.

Migrations esperadas, nesta ordem:

| Migration | Conteúdo |
| --- | --- |
| `20260505225826_init` | Estrutura inicial dos módulos existentes |
| `20260506000000_security_performance_indexes` | Índice único de agenda e índices de relacionamentos |
| `20261026000000_add_demands` | DemandStatus, Demand, FK de solicitante e índices |
| `20261026010000_extend_demand_fields` | DemandCategory, DemandReturnPreference e nove campos novos anuláveis |

As duas migrations de demandas são aditivas. Não removem tabelas/colunas/dados e não atribuem consentimento retroativo. A tabela pode existir sem a segunda migration: por isso é necessário conferir as colunas. O histórico sozinho não detecta toda alteração manual no schema.

Para conferir a estrutura real, use um cliente SQL confiável com o arquivo local `scripts/diagnose-demand-schema.sql`. Ele usa `BEGIN TRANSACTION READ ONLY`, consulta apenas metadados/histórico e termina em `ROLLBACK`. Não consulta pessoas, descrições, telefones ou senhas. No ambiente onde o arquivo estiver disponível e houver psql:

```sh
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f scripts/diagnose-demand-schema.sql
```

O arquivo ainda é local e não está no Render; é possível copiar seu SQL para o cliente sem publicar a aplicação. São esperados: Demand existente, 15 colunas, três enums com 1/7/2 valores, quatro índices (incluindo PK e chave de idempotência), PK/FK e as quatro migrations concluídas, sem falha ativa. Se `_prisma_migrations` estiver ausente ou houver migration falhada/divergência, pare e confronte o schema antes de qualquer baseline/resolve.

**Ainda não há lista confirmada de migrations pendentes em produção.** Para fechá-la, faltam a saída de status, os resultados de metadados e a exceção registrada ao repetir o GET autenticado. O SQL foi validado somente no banco local, sem alteração de dados; isso não comprova o schema de produção.

## Correção do banco, somente após confirmação e autorização

Se houver migrations apenas pendentes, sem histórico falhado ou objetos manuais conflitantes, faça backup/snapshot pelo provedor, revise todo o conjunto pendente e, após autorização, execute:

```sh
npx prisma migrate deploy
npx prisma migrate status
```

`migrate deploy` aplica **todas** as migrations pendentes, não somente a última. Se as duas de demandas forem as únicas pendentes, o impacto esperado é criar os objetos citados e adicionar colunas anuláveis; haverá DDL/locks breves e nenhum cadastro fictício. Não executar reset, db push, seed ou resolve automático. O índice único da migration de agenda pode falhar se já houver duplicidades preexistentes; revisar o status antes de presumir que somente demandas está pendente.

Configuração atual de build/start pode permanecer. Após autorização e validação, uma etapa de migrations pode ser configurada em **Pre-Deploy Command** (`npx prisma migrate deploy`), se disponível no plano; não foi ativada automaticamente nem incluída silenciosamente no build.

Manter as variáveis do backend no Render: `DATABASE_URL` apontando ao banco pretendido, `JWT_SECRET` estável e privado, `JWT_EXPIRES_IN` definido, `NODE_ENV=production`, `JSON_BODY_LIMIT=100kb` e `CORS_ORIGINS` incluindo `https://acao-social-frontend.vercel.app`. Não copiar segredos para variáveis `VITE_*`. O servidor usa o `PORT` fornecido pelo ambiente. Nenhuma dessas variáveis foi alterada nesta investigação.

## HTTP 401: defeitos confirmados e limites

Um 401 sem Authorization é esperado. Não foi confirmado se o 401 relatado pelo usuário veio de token expirado, assinatura de outro ambiente, usuário ausente ou banco indisponível.

Foi reproduzido um defeito independente: o catch geral de `authMiddleware` convertia qualquer erro da consulta de User/perfis em 401. A correção local mantém 401 para JWT inválido e conta inexistente, mas encaminha falhas do banco ao tratamento de 500. Isso preserva a sessão no frontend quando há indisponibilidade de infraestrutura; não desativa autenticação.

Também foi reproduzida uma corrida no frontend: um 401 atrasado de uma sessão antiga apagava uma sessão nova. Agora a limpeza só ocorre se o token da requisição ainda for o token atual. Respostas antigas do dashboard também não substituem dados de uma conta nova. A tela de login informa a expiração.

Para fechar a causa do 401 em produção: sair/entrar novamente no backend atual, conferir **apenas a presença** de Authorization no DevTools, verificar se persiste com login novo, confirmar no ambiente do Render que JWT_SECRET/JWT_EXPIRES_IN estão definidos (sem expor valores) e que a conta existe no banco conectado. Não trocar JWT_SECRET como tentativa aleatória: isso invalida sessões. Não enviar tokens ou segredos no chat/log.

## Tela branca: causa reproduzida e correção local

O cliente tratava a resposta JSON como `Page<T>` sem validação. Uma resposta 200 em array antigo, ou um envelope sem `data`, produzia `dashboard.consultas === undefined`; a renderização fazia `.slice()`. Listagens podiam receber `data` ausente e fazer `.length`. Foram criados testes que falharam antes da correção e passaram depois. O payload exato que disparou a falha em produção ainda não foi capturado, portanto não foi atribuído ao 500 por suposição.

A correção valida paginação, arrays, campos/relacionamentos consumidos pelas telas, opções de demandas e sessão antes de atualizar o estado. Respostas incompatíveis geram mensagem explícita, sem converter falhas em sucesso com array vazio. O dashboard diferencia carregamento, falha e dados. Há uma barreira final para exceções de renderização inesperadas, sem mostrar detalhes privados.

## Arquivos locais afetados

Backend: `src/middlewares/auth.middleware.ts`, seu compilado `dist/middlewares/auth.middleware.js`, `tests/demands.test.cjs`, `tests/demands.integration.cjs`, `scripts/diagnose-demand-schema.sql` e este relatório.

Frontend: `src/lib/api.ts`, `src/lib/response-validation.ts`, `src/App.tsx`, `src/main.tsx`, `src/components/RenderErrorBoundary.tsx`, `tests/api.test.mjs` e `scripts/check-api-failures.mjs`.

Não foram alterados schema Prisma, migrations existentes, endpoints, regras de demandas/matrículas ou configurações privadas.

## Testes

- Backend: 46 testes aprovados, incluindo erros de banco separados de credenciais inválidas; TypeScript/build aprovados.
- Frontend: 24 testes aprovados; TypeScript, Vite build e ESLint aprovados.
- PostgreSQL isolado: 9 cenários aprovados mais o agrupador (10 resultados); listagem/paginação, médico, instrutor, isolamento de usuário comum, idempotência e autenticação com JWT real. Também cobertos token expirado, assinatura diferente e conta inexistente. Nenhuma conexão com produção.
- Navegador Edge: dashboard, consultas, aulas, registro e gestão de demandas com sucesso, 404, 500, página incompatível, registros inválidos, opções inválidas e 401. APIs completamente simuladas; nenhum cadastro foi inserido. Exceção inesperada de renderização também verificada.
- SQL de diagnóstico validado no banco local em transação somente de leitura.
- Em produção foram feitos apenas os GETs públicos sem JWT descritos acima. O teste com JWT válido de produção permanece a cargo de uma sessão existente/autorizada; não foram criadas contas nem usados dados fictícios no serviço publicado.

## Publicação segura, após autorização

1. Obter logs/status/metadados e confirmar o motivo do 500 antes de alterar o banco.
2. Se houver pendências, revisar impacto e backup; obter autorização e aplicar somente pelo fluxo de migrate deploy. Confirmar status atualizado.
3. Os commits locais foram autorizados na revisão de 27/10/2026. Obter autorização específica para push e publicação; publicar backend com build/start atuais e Prisma Client correspondente.
4. Validar `/health` 200, `/demandas/options` 401 sem JWT e 200 com JWT novo válido, e `/demandas?page=1` 200 com envelope `{data,page,limit,total,totalPages}`. Conferir as duas funções profissionais e a consulta própria do usuário comum em contas autorizadas.
5. Na Vercel, manter `VITE_API_URL=https://acao-social-backend-3obx.onrender.com`, sem `/api` ou barra final; build `npm run build`, output `dist`. Publicar frontend somente após autorização. Variáveis VITE são incorporadas no build, não corrigidas alterando `.env` local depois.
6. Testar login novo, dashboard, consultas, aulas e as quatro telas de demandas; confirmar mensagens em falhas e ausência de tela branca. O teste local é repetível com `node scripts/check-api-failures.mjs` na pasta do frontend.

Referências: https://www.prisma.io/docs/cli/migrate/status ; https://render.com/docs/deploy-prisma-orm ; https://render.com/docs/deploys .
