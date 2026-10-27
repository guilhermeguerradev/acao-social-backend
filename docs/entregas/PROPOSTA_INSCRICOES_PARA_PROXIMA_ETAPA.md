# Inscrições com análise — proposta mínima, ainda não implementada

O usuário substituiu a matrícula imediata por pedidos sujeitos a análise. A implementação ficará para depois da conclusão e validação do módulo de demandas. Nenhum endpoint, tabela ou formulário desta proposta foi criado.

## Modelagem candidata

Reutilizar `User`, `Beneficiario`, `Aula` e `Matricula`. Acrescentar somente uma entidade de pedido, por exemplo `EnrollmentRequest`, contendo ID, usuário solicitante, beneficiário, aula, situação e datas de criação/análise. O pedido aprovado poderá se relacionar à matrícula gerada. Identidade de quem analisa e data da decisão permitem registrar a operação.

Situações propostas para discussão: `PENDING` (Aguardando análise), `APPROVED` (Aprovada, com matrícula criada) e `REJECTED` (Não aprovada). Não acrescentar cancelamento, lista de espera ou outros estados sem aprovação.

## Vagas

Proposta: pedidos pendentes não ocupam nem reservam vagas. A aprovação revalida disponibilidade e duplicidade e cria a matrícula na mesma transação serializável que registra a decisão. Se não houver vaga, a aprovação falha sem criar matrícula e sem declarar aprovação.

## Permissões que precisam ser aprovadas

- Quem pode solicitar para um beneficiário existente? A aplicação ainda não tem vínculo de titularidade entre conta e beneficiário.
- Quem pode consultar pedidos de outras pessoas?
- Quem analisa? Opção mínima sugerida: instrutor responsável pela aula; ampliar para outros perfis depende de confirmação explícita.

As permissões dos CRUDs atuais não serão alteradas automaticamente por essa proposta.

## Duplicidade

Bloquear novo pedido pendente para o mesmo beneficiário/aula, independentemente de quem o solicita, e bloquear pedido quando já houver matrícula efetivada. Usar proteção no banco para o pedido pendente, chave de reenvio e transação na aprovação. Também é necessário decidir se um pedido rejeitado permite nova solicitação; essa regra não será escolhida sem confirmação.

## Contrato candidato

`POST /inscricoes`, `GET /inscricoes` e `GET /inscricoes/:id`, com autorização e paginação. As operações de decisão só serão definidas após aprovação dos estados e de quem pode analisar. O código deverá reutilizar as regras de matrícula existentes sem fazer uma chamada HTTP interna insegura ou duplicar sua validação.

Os dados de participante/responsável mostrados nas imagens, como nascimento e vínculo familiar, também precisam de definição antes de criar campos adicionais. Não serão presumidos a partir do cadastro atual de beneficiário.
