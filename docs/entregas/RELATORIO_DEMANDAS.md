# Ação Social — entrega do módulo de demandas

Data: 26/10/2026.

## Escopo concluído

Implementados registro, revisão, envio/recebimento e gestão de demandas. As inscrições ficam para a próxima rodada, conforme a última definição do usuário. Nenhuma alteração foi feita no Figma.

O acesso continua autenticado. A descrição é obrigatória, com trim e limite de 1 a 2.000 caracteres. A conta autenticada identifica o solicitante; não há novos dados pessoais, categorias ou relacionamento com beneficiário. A única situação disponível é `RECEIVED`, exibida como **Recebida**.

Solicitantes comuns consultam somente suas demandas. Médicos e instrutores podem consultar todas. As regras são aplicadas no backend; o servidor não aceita solicitante ou situação enviados pelo cliente. A resposta expõe somente o nome/ID da conta responsável, sem senha ou email. Não foram criadas operações de aprovação, rejeição, atribuição de responsável ou alteração de situação.

## Fluxo e navegação

1. Após login, a aba **Solicitar apoio** abre o registro da demanda.
2. **Continuar para revisão** valida e apresenta a descrição e o solicitante, sem gravar no banco.
3. **Voltar e editar** preserva o texto; **Confirmar envio** realiza a única operação de criação.
4. **Solicitação enviada** aparece somente após sucesso da API, com identificação, data, descrição e mensagem de que recebimento não significa aprovação.
5. **Consultar demandas** abre a listagem; **Ver detalhes** consulta novamente o backend com autorização.
6. A aba **Demandas** exibe gestão interna para médicos/instrutores e demandas próprias para os demais usuários. Há paginação, atualização, estados de carregamento, erro e vazio, retorno e nova tentativa.

O rascunho permanece em memória durante a navegação entre abas e etapas; é descartado ao sair da conta ou recarregar a página. Não é gravado no armazenamento do navegador. Em erros de envio, a descrição e a chave técnica são preservadas. O bloqueio de clique duplo e a chave técnica com constraint única impedem duplicação por reenvios da mesma operação, inclusive simultâneos. Uma solicitação explicitamente nova recebe nova chave.

## Endpoints adicionados

| Endpoint | Resultado |
| --- | --- |
| `POST /demandas` | Cria para o usuário autenticado; 201 na criação e 200 no reenvio idêntico. |
| `GET /demandas` | Lista paginada com escopo imposto pelo servidor. |
| `GET /demandas/:id` | Consulta autorizada; 404 para demandas de outro solicitante sem permissão. |

O POST aceita apenas `description` e `requestKey` (UUID técnico). A chave já usada com descrição diferente retorna 409. O GET aceita `page` e `limit`, com padrões 1/20 e máximo 100, ordenação por data decrescente e desempate por ID.

## Prisma e persistência

- Novo modelo `Demand`, com ID, descrição, situação, conta responsável, data e chave técnica de envio.
- Enum `DemandStatus` contendo somente `RECEIVED`.
- Relação `User.demands` e FK com exclusão restrita, preservando a identificação do solicitante.
- Índices para listagens e constraint única por usuário/chave técnica.
- Migration aditiva `20261026000000_add_demands`, aplicada somente ao banco local `localhost:5435/acao_social`.
- Nenhuma tabela existente foi removida ou reestruturada. Nenhum banco de produção foi acessado.

## Arquivos desta entrega

Backend — criados:

- `src/modules/demanda/demanda.schema.ts`
- `src/modules/demanda/demanda.service.ts`
- `src/modules/demanda/demanda.controller.ts`
- `src/modules/demanda/demanda.routes.ts`
- `prisma/migrations/20261026000000_add_demands/migration.sql`
- `tests/demands.test.cjs`
- `tests/demands.integration.cjs`

Backend — modificados:

- `prisma/schema.prisma`
- `src/routes/index.ts`
- `src/utils/listQuery.ts`
- `package.json` (comando opt-in de teste de integração; sem nova dependência)
- `API_DOCUMENTATION.md`
- Compilados correspondentes em `dist/`, gerados pelo build.

Frontend — criados:

- `src/components/demands/DemandForm.tsx`
- `src/components/demands/DemandFlow.tsx`
- `src/components/demands/DemandSummary.tsx`
- `src/components/demands/DemandDetails.tsx`
- `src/components/demands/DemandManagement.tsx`
- `tests/demands.test.mjs`

Frontend — modificados:

- `src/App.tsx` (integração das duas abas, rascunho e atualização da listagem)
- `src/lib/api.ts`
- `src/lib/types.ts`
- `tests/api.test.mjs`
- `API_DOCUMENTATION.md`

Workspace: `RELATORIO_DEMANDAS.md`.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Backend: `npm test`, incluindo TypeScript e build | 36 testes aprovados (22 anteriores e 14 novos) |
| Frontend: `npm test` | 16 testes aprovados (9 anteriores e 7 novos) |
| Integração HTTP/Prisma/PostgreSQL em schema temporário | 7 registros de teste aprovados: 6 cenários e o teste agrupador |
| Frontend: `npm run build` | TypeScript e Vite aprovados |
| Frontend: `npm run lint` | Aprovado |
| API real local: `/health` | HTTP 200 |
| API real local e proxy do frontend: `/demandas`, sem JWT | HTTP 401 |
| API real local e proxy do frontend: `/demandas`, com JWT | HTTP 200 e envelope paginado válido |

Os testes novos cobrem validação, vínculo com a conta autenticada, rejeição de campos extras, escopo de consultas, perfis profissionais, identidade ausente, JWT inválido, claims de papel forjadas, persistência real, integridade da FK, paginação, reenvios sequenciais e concorrentes, erros sem falsa confirmação e transições de registro/revisão/confirmação.

Os testes do fluxo frontend exercitam os handlers e transições de estado com hooks simulados; não são testes de navegador. A integração PostgreSQL usa Express e JWT reais com Prisma conectado a um schema isolado, removido no final. Nenhum registro fictício foi deixado nas tabelas da aplicação; a tabela local de demandas estava vazia após as verificações.

## Situação das oito páginas

| Página | Situação |
| --- | --- |
| Registro de demanda | Implementada e testada automaticamente; conferência visual no navegador pendente. |
| Revisão de demanda | Implementada e testada automaticamente; conferência visual no navegador pendente. |
| Solicitação enviada | Implementada e testada automaticamente; confirmação após persistência verificada. |
| Gestão interna de demandas | Implementada; autorização, listagem e detalhes testados via API/integração; conferência visual pendente. |
| Catálogo de cursos | Entrega anterior preservada; testes existentes aprovados. |
| Curso Bombeiro Mirim | Detalhes genéricos implementados; cadastro real do curso ainda pendente. Não foi criado conteúdo fictício. |
| Pedido de inscrição | Pendente para a próxima rodada. Matrícula imediata e permissões atuais já aprovadas. |
| Inscrição recebida | Pendente para a próxima rodada, após sucesso real da matrícula. |

Não é possível declarar concluídas todas as oito páginas. Restam o fluxo de inscrições, o cadastro real de Bombeiro Mirim e a conferência visual no navegador. Não foi verificada fidelidade ao Figma.

Nenhum commit, push ou deploy foi realizado. Os CRUDs, catálogo e detalhes existentes foram preservados.
