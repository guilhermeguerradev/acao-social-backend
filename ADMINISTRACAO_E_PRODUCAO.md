# Administracao e diagnostico de producao

## Erros identificados no log recebido

- `P2021`, `public.Demand does not exist`: falta a estrutura de Demandas no banco efetivamente conectado ao Render. Corrigir o schema e necessario; mensagens de frontend ou autenticacao nao criam a tabela.
- `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`: o Render encaminha trafego pelo proxy. O app agora confia em um hop somente quando `RENDER=true`; fora do Render permanece `false`. Nao usar `trust proxy=true` nem desabilitar as validacoes do rate limiter. Se a topologia mudar, reavaliar a quantidade de hops.
- `Token nao fornecido` ao abrir `/demandas?page=1` na barra do navegador e esperado: a navegacao direta nao envia `Authorization: Bearer ...`. Testar pela interface autenticada, sem colocar JWT na URL.
- O aviso de mudanca futura dos modos SSL nao explica `P2021`. Nao desativar verificacao TLS para tentar resolver tabela ausente.

O backend retorna 503 com codigo `DEMANDS_UNAVAILABLE` para tabela/coluna de Demandas ausente nessa rota, sem expor detalhes internos na resposta. Outras falhas continuam usando o tratamento existente. A interface mostra o erro e preserva a sessao; 401 continua reservado a autenticacao invalida.

## Permissao de administrador

`User.isAdmin` e persistido, inicia em `false` e gera o papel `ADMIN`. A autenticacao consulta o banco em toda requisicao: alterar o papel no armazenamento do navegador ou manter um JWT antigo nao concede acesso administrativo.

Administradores acessam os CRUDs existentes, inclusive aulas e consultas de outros profissionais, e consultam todas as demandas. Podem escolher o profissional responsavel ao criar aulas/consultas. Permanecem as validacoes de capacidade, conflito de horario, duplicidade e integridade referencial. As funcoes operacionais de medicos e instrutores foram preservadas. A gestao interna de usuarios e a criacao/edicao/exclusao de perfis profissionais agora sao exclusivas do administrador. Consultas autenticadas aos diretorios de profissionais permanecem disponiveis para os formularios de aulas e consultas.

Usuarios comuns/profissionais nao podem editar ou excluir uma conta administradora. Ninguem pode excluir a propria conta pela API. Excluir outra conta remove seus perfis profissionais vazios na mesma transacao; consultas, aulas e demandas vinculadas impedem a exclusao com 409, preservando o historico. Nao ha exclusao em cascata de registros de atendimento.

Os formularios publicos nao aceitam `isAdmin`. Nao existe cadastro publico de administrador, senha padrao, seed de administrador ou promocao automatica do primeiro cadastro. Nao foram adicionadas aprovacao/rejeicao, edicao/exclusao de demandas ou mudanca de situacao.

## Promover usuarios pela interface

Um administrador existente abre Usuarios, escolhe a conta e usa Promover a administrador. A confirmacao mostra nome e email. `POST /users/:id/promote-admin` exige ADMIN, valida o UUID e corpo vazio, verifica novamente o administrador na transacao e altera apenas isAdmin. Perfis de medico/instrutor e demais dados sao preservados. Repetir a promocao mantem o mesmo privilegio; nao ha rebaixamento neste fluxo. Sair e entrar atualiza o rotulo na interface; a API consulta a permissao atual a cada requisicao.

`/users` e suas operacoes administrativas exigem ADMIN, incluindo criar usuarios sem perfil. `PUT /users/me` permite ao autenticado alterar apenas seus proprios nome, email e senha; nunca permissoes. Medicos/instrutores nao podem administrar terceiros nem vincular/editar/excluir perfis. O cadastro publico da propria conta profissional continua separado e nao aceita isAdmin. A criacao inicial de administrador via SQL e somente o bootstrap manual ja preparado, nao um fluxo publico. Esta alteracao nao adiciona migrations.

## Migration nova: nao executada

As quatro migrations originais foram preservadas. Esta entrega acrescenta uma quinta:

`20261027000000_add_user_admin`

```sql
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;
```

Este codigo exige essa coluna antes do uso de login e rotas autenticadas. Nao publicar o codigo novo sobre um banco sem essa migration. O roteiro anterior de quatro migrations corresponde ao codigo anteriormente publicado, nao a esta entrega local.

Nao foi executada migration, baseline, limpeza ou seed, localmente ou em producao. Nenhuma configuracao do Render, Neon, Vercel ou arquivo .env foi alterada.

## Ativacao controlada no Neon e Render

1. Confirmar no painel a branch `production`, banco `neondb`, role `neondb_owner` e a correspondencia com a conexao do Render. Inventario antigo nao prova o estado atual.
2. Concluir o procedimento de banco ja autorizado, com inventario atualizado antes de qualquer limpeza. Nao repetir DROP se o estado ja mudou. Nao executar automaticamente o plano antigo.
3. Para publicar esta entrega sera necessario autorizar commit/push/deploy separadamente. Na revisao que contem a quinta migration, `prisma migrate deploy` aplica somente as pendentes: se as quatro primeiras ja existem, aplica apenas a quinta; num banco vazio, aplica as cinco.
4. Pelo ambiente Render, verificar `prisma migrate status` e `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`. Esperado: atualizado, diff vazio, oito tabelas de negocio e `_prisma_migrations`. Nao deixar migrations permanentes no build; restaurar o comando normal apos a execucao pontual previamente autorizada.
5. Cadastrar uma conta com email e senha escolhidos pelo responsavel na interface. Semear dados nao e necessario. Identificar privadamente seu UUID no Neon.
6. Depois de aprovar especificamente a conta a promover, executar no SQL Editor correto, substituindo o marcador por seu UUID real. Este exemplo NAO foi executado:

```sql
BEGIN;
UPDATE public."User"
SET "isAdmin" = true, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'UUID_DA_CONTA_CONFIRMADA'
RETURNING "id", "isAdmin";
-- Conferir exatamente uma linha e somente entao executar COMMIT.
-- Se nao corresponder ao usuario esperado, executar ROLLBACK.
```

7. Sair e entrar novamente para atualizar a identificacao do perfil na interface. Testar usuarios, beneficiarios, aulas, consultas, matriculas e Demandas autenticado. Contas com registros vinculados retornam conflito ao excluir; isso preserva os dados.

`/health` nao consulta o banco e nao comprova a existencia de Demand. O teste real e a listagem autenticada e o fluxo registro/revisao/envio. Nao provocar indisponibilidade do banco para testar erros: os testes locais usam respostas simuladas.
