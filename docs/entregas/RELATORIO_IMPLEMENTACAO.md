# Ação Social — relatório de implementação

Data: 26/10/2026.

## 1. Features concluídas

| Feature | Diagnóstico inicial | Resultado |
| --- | --- | --- |
| 01 — Edição de beneficiários | Schema existente; rota, controller, service e interface ausentes | PUT autenticado; somente nome e telefone; existência validada; formulário reutilizado com preenchimento, salvamento e cancelamento |
| 02 — Reagendamento | Endpoint e método de API existentes; interface ausente | Formulário reutilizado; horário atual exibido; ação disponível ao médico responsável; validações de passado, conflito e autoria preservadas |
| 03 — Edição de aulas | Endpoint e método de API existentes; interface ausente | Edição de título, modalidade e vagas pelo instrutor responsável; proibição de transferência preservada; validação de capacidade e atualização na mesma transação serializável |
| 04 — Edição de matrículas | Endpoint transacional e método de API existentes; interface ausente | Atualização por PUT; seleção de aula e beneficiário; aula atual continua disponível mesmo lotada; vínculos e regras de duplicidade preservados |
| 05 — Busca de beneficiários | Ausente | Busca parcial por nome no PostgreSQL com Prisma e modo insensitive; debounce de 300 ms; limpeza e paginação combinadas |
| 06 — Paginação | Quatro módulos limitados a 100 registros | page/limit validados; skip/take; total/totalPages; desempate por ID; controles nas quatro telas; totais do dashboard independentes da página |
| 07 — Filtros | Ausentes | Consultas por médico, beneficiário e intervalo; aulas por instrutor, modalidade e disponibilidade; filtros combinados no servidor; mudança de filtro volta à página 1 |
| 08 — Usuários | CRUD backend e edição da própria conta existentes; edição/exclusão na listagem ausentes | Edição básica de nome/email e exclusão com confirmação para os perfis já autorizados; atualização da listagem; dependências retornam 409 |

As exclusões nas telas alteradas usam confirmação no modal existente. Os formulários mantêm os valores quando a API rejeita a alteração e desabilitam o envio durante a operação. Respostas 401 limpam a sessão; 204 não tenta interpretar JSON. O modal de matriculados continua disponível, agora com consulta paginada por aula para não omitir registros.

## 2. Funcionalidades existentes preservadas

- Express, React, TypeScript, Prisma, PostgreSQL, JWT, componentes visuais e estrutura modular.
- Endpoints PUT de consultas, aulas, matrículas e usuários; nenhum endpoint equivalente foi duplicado.
- Transações serializáveis de matrículas, restrições únicas de matrícula/horário e relacionamentos do schema.
- Regras de autoria de médicos/instrutores e permissões atuais de gerenciamento de usuários. Nenhum perfil ADMIN foi criado.
- Cadastro, exclusão, login, vinculação de perfis e edição da própria conta.
- Seleções de beneficiários/aulas percorrem as páginas necessárias, sem limitar opções aos primeiros 100 itens; apenas as opções necessárias à tela aberta são carregadas.

## 3. Arquivos criados

Backend:

- `acao-social-backend/src/utils/listQuery.ts`: validação de query e envelope paginado.
- `acao-social-backend/tests/features.test.cjs`: 22 testes com executor nativo do Node.
- `acao-social-backend/dist/utils/listQuery.js`: compilado gerado pelo build.

Frontend:

- `acao-social-frontend/src/lib/listing.ts`: carregamento paginado, debounce, cancelamento de requisições obsoletas e retorno à página válida após exclusões.
- `acao-social-frontend/tests/api.test.mjs`: 7 testes do cliente HTTP.

Workspace:

- `RELATORIO_IMPLEMENTACAO.md`: este relatório. Os scripts temporários usados na edição foram removidos.

## 4. Arquivos modificados

Backend:

- `src/modules/beneficiario/beneficiario.routes.ts`
- `src/modules/beneficiario/beneficiario.controller.ts`
- `src/modules/beneficiario/beneficiario.schema.ts`
- `src/modules/beneficiario/beneficiario.service.ts`
- `src/modules/consulta/consulta.controller.ts`
- `src/modules/consulta/consulta.service.ts`
- `src/modules/aula/aula.controller.ts`
- `src/modules/aula/aula.schema.ts`
- `src/modules/aula/aula.service.ts`
- `src/modules/matricula/matricula.controller.ts`
- `src/modules/matricula/matricula.service.ts`
- `src/modules/user/user.service.ts`
- `src/middlewares/error.middleware.ts`
- `package.json`: comando de testes, sem nova dependência.
- `API_DOCUMENTATION.md`: novo contrato paginado, parâmetros e edição de beneficiário.
- Arquivos correspondentes em `dist/`, já versionados pelo projeto, foram regenerados pelo build. Outros arquivos podem aparecer no status por finais de linha; o diff textual contém as alterações relacionadas às fontes acima.

Frontend:

- `src/App.tsx`: formulários de edição, filtros, controles de paginação, confirmações, totais e sessão expirada.
- `src/lib/api.ts`: envelope paginado, seletores, dashboard, edição de beneficiário, exclusão de usuário e tratamento de 401.
- `src/lib/types.ts`: tipos de paginação e totais.
- `package.json`: comando de testes, sem nova dependência.
- `API_DOCUMENTATION.md`: documentação sincronizada com o backend.

Não houve alteração no schema Prisma nem criação de migrations. Os lockfiles e as dependências declaradas foram preservados.

## 5. Endpoints adicionados ou alterados

Novo: `PUT /beneficiarios/:id`, autenticado, com `name` e/ou `telefone`. Outros campos são rejeitados. Telefone vazio permite limpar o valor.

Listagens alteradas:

| Endpoint | Filtros adicionais |
| --- | --- |
| `GET /beneficiarios` | `search` |
| `GET /consultas` | `medicoId`, `beneficiarioId`, `startDate`, `endDate` |
| `GET /aulas` | `instrutorId`, `modalidade`, `available=true/false` |
| `GET /matriculas` | `aulaId` |

Todos aceitam `page` (padrão 1) e `limit` (padrão 20, máximo 100). Datas usam ISO com fuso; limites do intervalo são inclusivos. O filtro de disponibilidade é calculado no PostgreSQL com uma consulta parametrizada via Prisma, sem carregar aulas para filtrar no frontend.

O retorno dessas quatro listagens passou de array para:

```json
{ "data": [], "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
```

Os consumidores locais foram atualizados. Consumidores externos, se existirem, precisam adotar esse envelope. As listagens de usuários, médicos e instrutores mantêm o contrato anterior.

As atualizações existentes mantêm seus paths. Houve reforço da autoria em consultas/aulas, tradução de conflito único de horário para 409 e de conflitos transacionais para resposta apropriada. Exclusões de usuários/beneficiários distinguem dependência de registro ausente.

## 6. Testes e verificações executados

| Verificação | Resultado |
| --- | --- |
| Backend: `npm test` (inclui `prisma generate`, TypeScript e testes) | 22 testes aprovados |
| Frontend: `npm test` | 7 testes aprovados |
| Frontend: `npm run build` (TypeScript e Vite) | Aprovado, inclusive após o ajuste final de carregamento |
| Frontend: `npm run lint` | Aprovado |
| Ambos: `git diff --check` | Sem erros de whitespace |

Cobertura: atualização/existência/validação de beneficiário; busca e paginação; datas e conflitos de consulta; autoria; transferência e capacidade de aulas; existência, lotação e duplicidade de matrículas; transações; filtros; dependências de exclusão; JWT inválido/ausente e autorização via HTTP; 204/401/403/404/409; seleção além da primeira página; indicadores do dashboard e métodos PUT.

Os testes de backend substituem o módulo Prisma antes de importar os services. Os testes HTTP usam Express real, mas banco e verificação do token são simulados. Não há conexão ao PostgreSQL nem alteração de dados reais nos testes. Os testes do frontend exercitam o cliente HTTP com respostas simuladas; não são testes de navegação visual.

## 7. Problemas encontrados e tratamento

- O sandbox bloqueou a leitura do workspace; os comandos necessários foram executados com a permissão solicitada.
- As listagens antigas ocultavam registros acima de 100; substituídas pela paginação nos quatro módulos solicitados.
- Algumas exclusões reportavam 404 para dependências; corrigidas nos módulos afetados.
- O usuário atualizado na administração não era recarregado pelo dashboard; a administração agora atualiza sua própria listagem.
- O feedback de sucesso era apagado durante o recarregamento; a mensagem agora é apresentada após essa etapa.
- A documentação ainda afirmava não existir busca, paginação ou PUT de beneficiário; atualizada.
- O lint inicialmente rejeitou o teste CommonJS do frontend; o teste foi convertido para ESM e passou.

## 8. Limites e pendências de validação

Não há decisão funcional pendente identificada nas oito features. Permanecem validações de ambiente: execução contra PostgreSQL isolado para conferir SQL, concorrência real e constraints; e conferência visual/manual dos fluxos no navegador. Essas validações não foram realizadas nesta sessão.

Não houve commit, push, merge, deploy, alteração de infraestrutura ou operação em produção.
