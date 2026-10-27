# Módulo de demandas — contrato completo implementado

Data: 26/10/2026. Escopo: somente demandas; inscrições continuam para outra entrega.

## Funcionalidades

As quatro telas estão integradas: Registro de demanda, Revisão de demanda, Solicitação enviada e Gestão interna de demandas. A interface segue a estrutura das imagens fornecidas, com etapas, seções, resumo lateral, orientações e layout responsivo, preservando os componentes e a identidade visual existentes. Não foi alegada reprodução integral do Figma.

Campos implementados:

- Nome obrigatório obtido da conta autenticada, somente leitura, sem alterar a conta e sem aceitar nome do cliente no POST.
- Telefone/WhatsApp obrigatório, validado como formato brasileiro com DDD; formatação e +55 são aceitos e normalizados para 10/11 dígitos nacionais.
- Bairro obrigatório, trim, 1–120 caracteres.
- Retorno obrigatório: WhatsApp ou Ligação telefônica, sem seleção inicial.
- Tipo obrigatório com somente as sete categorias aprovadas, sem seleção inicial.
- Outros exige especificação de 1–200 caracteres; texto oculto desse campo não é persistido em outra categoria.
- Urgência obrigatória Sim/Não, sem seleção inicial e sem prioridade ou aprovação automática.
- Descrição obrigatória, trim, 1–2.000 caracteres.
- Autorização explícita obrigatória, inicialmente desmarcada.
- Anexo visualmente indicado como indisponível, sem seletor ou envio e sem bloquear a solicitação.

Registro e revisão não gravam dados. A confirmação final é a única criação; o sucesso só aparece após resposta válida da API. Voltar mantém todos os campos. Falhas mantêm o formulário, a revisão e a chave de envio. Nova solicitação limpa os campos, desmarca consentimento e gera outra chave.

O servidor registra data, versão `contact-v1` e o texto completo aprovado do consentimento. O POST não aceita esses valores técnicos do cliente. Identidade e perfil vêm do JWT validado contra a conta atual. A situação permanece apenas `RECEIVED` (Recebida).

## API e autorização

- `POST /demandas`: contrato completo, Zod, normalização e criação autenticada; 201 na primeira criação.
- `GET /demandas/options`: fonte única de códigos/rótulos de categorias, retorno e texto/versão de consentimento para o formulário; exige JWT.
- `GET /demandas`: listagem paginada e busca, sempre com escopo de acesso aplicado no servidor.
- `GET /demandas/:id`: somente o próprio solicitante, ou médicos/instrutores; 404 para demanda de terceiro sem acesso.

As permissões anteriores foram preservadas. Nenhuma operação de aprovação, rejeição, mudança de situação, responsável ou upload foi criada.

Idempotência: chave única por solicitante; comparação de descrição, telefone, bairro, retorno, categoria, especificação e urgência após normalização. Mesmo envio retorna 200 e o mesmo registro; qualquer diferença relevante com a mesma chave retorna 409. Reenvios não alteram data, versão ou texto do consentimento original. A constraint do banco arbitra envios concorrentes.

## Migration e dados existentes

Migration aditiva: `acao-social-backend/prisma/migrations/20261026010000_extend_demand_fields/migration.sql`.

Adicionados os enums `DemandCategory` e `DemandReturnPreference` e os campos de contato/pedido/consentimento no modelo `Demand`. Os campos são nulos nos registros anteriores, mas obrigatórios na validação de novos envios. Não houve preenchimento retroativo, defaults fictícios ou consentimento atribuído a demandas antigas.

A migration foi aplicada somente em `localhost:5435/acao_social`, ambiente de desenvolvimento. Antes e depois foram comparados os 66 registros existentes e um checksum de seus campos anteriores: quantidade e conteúdo permaneceram idênticos. Nenhum banco de produção foi acessado.

## Arquivos alterados nesta entrega

Backend:

- `prisma/schema.prisma`
- `prisma/migrations/20261026010000_extend_demand_fields/migration.sql` (novo)
- `src/modules/demanda/demanda.options.ts` (novo)
- `src/modules/demanda/demanda.schema.ts`
- `src/modules/demanda/demanda.service.ts`
- `src/modules/demanda/demanda.routes.ts`
- `tests/demands.test.cjs`
- `tests/demands.integration.cjs`
- `API_DOCUMENTATION.md`
- Compilados correspondentes em `dist/`, regenerados pelo build.

Frontend:

- `src/lib/types.ts`
- `src/lib/api.ts`
- `src/lib/demand-options.ts` (novo: carregamento das opções, validação e transformação do rascunho)
- `src/components/demands/DemandForm.tsx`
- `src/components/demands/DemandFlow.tsx`
- `src/components/demands/DemandDraftSummary.tsx` (novo)
- `src/components/demands/DemandSummary.tsx`
- `src/components/demands/DemandManagement.tsx`
- `tests/demands.test.mjs`
- `scripts/preview-demands.mjs`
- `API_DOCUMENTATION.md`

Workspace: `CONTRATO_DEMANDAS_PARA_APROVACAO.md` atualizado como aprovado/implementado e este relatório. Os outros módulos e CRUDs não foram reimplementados.

## Testes e validação

| Verificação | Resultado |
| --- | --- |
| Backend: `npm test` (inclui TypeScript e build) | 41 testes aprovados |
| Frontend: `npm test` | 18 testes aprovados |
| Frontend: TypeScript, Vite e ESLint | Aprovados |
| PostgreSQL isolado, JWT e HTTP reais | 8 cenários aprovados + teste agrupador (9 resultados) |
| Prisma validate e migrate status | Schema válido e banco atualizado |
| Navegador Edge headless em desktop e celular | Fluxo completo verificado |

Cobertura: todos os campos obrigatórios, opções permitidas, telefone (incluindo DDD 55), limites e trim, Outros, consentimento falso/ausente, tentativa de falsificar solicitante/situação/consentimento, reenvios equivalentes com formatação diferente, alteração de cada campo com a mesma chave, concorrência, autenticação, consulta própria, consulta profissional, busca com privacidade e integridade referencial.

O teste PostgreSQL insere uma demanda com a modelagem anterior **antes** da migration aditiva, e comprova que ela permanece acessível com contato/consentimento nulos após a atualização. Usa schema temporário exclusivo, removido ao final.

No navegador foram verificados nome somente leitura, nenhuma seleção inicial, consentimento inicialmente desmarcado, seleção Outros e complemento obrigatório, preenchimento, revisão, retorno preservando os dados, envio, confirmação após persistência, reinício do formulário, gestão, busca, detalhes e viewport de 390 px sem rolagem horizontal. A demanda de teste foi conferida no banco e removida por ID e marcador exclusivos. As capturas estão em `acao-social-frontend/.artifacts/`.

Durante a validação foi encontrada uma instância antiga do backend com cliente Prisma anterior. Somente essa instância foi reiniciada; o fluxo completo foi repetido e passou. O backend atualizado ficou disponível na porta 8080.

## Pendências

- Upload de anexos: adiado por decisão do usuário; nenhum endpoint, armazenamento ou tabela de arquivos foi criado.
- Pedidos de inscrição sujeitos a análise: proposta separada, sem implementação nesta entrega.
- Cadastro real de Bombeiro Mirim: permanece uma decisão de conteúdo; os registros `[DEMO]` não representam oferta real confirmada.

O módulo de demandas está implementado para o contrato aprovado. As oito páginas do projeto inteiro ainda não devem ser consideradas concluídas, pois o fluxo de inscrições permanece pendente. Não houve commit, push, deploy ou alteração no Figma.
