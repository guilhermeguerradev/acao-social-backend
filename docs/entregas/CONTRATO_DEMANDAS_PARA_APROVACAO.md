# Demandas — contrato final aprovado e implementado

As imagens são referências visuais. As opções de negócio abaixo foram definidas e aprovadas pelo usuário, não extraídas automaticamente do Figma. O contrato foi implementado nas quatro telas e na API. Consulte `RELATORIO_DEMANDAS_COMPLETO.md` para arquivos, migration e validação.

## Dados de novo envio

`POST /demandas`, autenticado. O corpo aceitará somente os campos abaixo; campos extras serão rejeitados.

| Campo | Tipo / regra |
| --- | --- |
| `description` | Texto obrigatório, trim, de 1 a 2.000 caracteres. |
| `phone` | Texto obrigatório. Aceitar formatação e prefixo opcional +55; normalizar para 10 ou 11 dígitos nacionais, incluindo DDD. DDD com dois dígitos não iniciados em zero; fixo com oito dígitos iniciado por 2–5 ou celular com nove dígitos iniciado por 9. Isso valida formato, não existência ou titularidade da linha. |
| `neighborhood` | Texto obrigatório, trim, de 1 a 120 caracteres. |
| `returnPreference` | Enum obrigatório `WHATSAPP` ou `PHONE_CALL`. Nenhuma opção inicial. |
| `category` | Enum obrigatório com os sete valores aprovados descritos abaixo. Nenhuma opção inicial. |
| `otherDescription` | Texto trim, de 1 a 200 caracteres, obrigatório quando a categoria for `OTHER`; nas demais categorias, não será persistido. |
| `urgent` | Boolean obrigatório. A interface oferece “Sim” e “Não”, sem seleção inicial. Não altera situação nem prioridade automática. |
| `contactConsent` | Deve ser literalmente `true`. Checkbox começa desmarcado. |
| `requestKey` | UUID técnico gerado pelo cliente, preservado entre revisão e tentativas para impedir duplicação. |

Nome, solicitante, situação e data de criação não serão aceitos do cliente. A conta autenticada fornece o nome e o vínculo; o formulário não altera o nome da conta. A situação continua `RECEIVED`, exibida como **Recebida**.

## Categorias e rótulos

| Valor | Texto na interface |
| --- | --- |
| `FOOD` | Alimentos ou cesta básica |
| `CLOTHING` | Roupas e calçados |
| `HYGIENE` | Produtos de higiene pessoal |
| `HEALTH` | Medicamentos ou apoio relacionado à saúde |
| `EDUCATION` | Apoio educacional |
| `SOCIAL_ASSISTANCE` | Orientação ou assistência social |
| `OTHER` | Outros |

Retorno: `WHATSAPP` = WhatsApp; `PHONE_CALL` = Ligação telefônica. Frontend e backend usarão os mesmos códigos, com testes de correspondência.

## Consentimento

Texto aprovado e registrado: **“Autorizo o uso dos dados informados para análise e contato sobre esta solicitação.”**

O servidor valida a autorização explícita e registra a data de recebimento, a versão `contact-v1` e o texto completo desse consentimento. Esse mecanismo registra a escolha informada no formulário; não apresenta uma avaliação jurídica do texto. O endpoint autenticado `GET /demandas/options` fornece a fonte de opções e do texto de consentimento para o frontend.

## Dados antigos e alteração no Prisma

Migration apenas aditiva: telefone, bairro, preferência, categoria, complemento de Outros, urgência, data e versão do consentimento serão opcionais no armazenamento para preservar registros já existentes. Todos os dados exigidos acima serão obrigatórios na validação de novos envios.

Os campos novos de demandas antigas permanecerão nulos. A interface mostrará “Não informado neste registro” quando apropriado. Não será inventado consentimento retroativo nem preenchimento fictício desses campos.

A resposta autorizada incluirá os novos dados necessários à revisão e consulta. As permissões atuais continuarão: solicitante comum somente suas demandas; médicos e instrutores todas. A busca deverá continuar respeitando esse escopo, incluindo no total paginado.

O controle de reenvio passará a comparar todo o conteúdo normalizado, além da descrição, para impedir reutilização da mesma chave com dados diferentes.

## Anexos

Fora desta entrega, conforme decisão do usuário. A área visual fica desabilitada, sem seletor, envio, endpoint de upload, armazenamento ou tabela de anexos. A ausência de arquivo não bloqueia o envio.

## Fluxo

Registro → Revisão → Confirmação após resposta bem-sucedida da API. Voltar preserva os campos; erros não limpam os dados. O resumo lateral, os detalhes e os cartões de gestão exibem os novos dados reais. Não há aprovação, rejeição, atribuição de responsável ou alteração de situação de demandas.
