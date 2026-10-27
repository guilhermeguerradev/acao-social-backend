# Entregas e publicação

Os relatórios desta pasta são cópias dos documentos produzidos no workspace. São registros históricos: contagens de dados e instruções de etapas anteriores devem ser interpretadas pela data de cada entrega. A orientação atual para iniciar sem dados fictícios está em `../../INICIO_SEM_DADOS_FICTICIOS.md`.

## Revisão antes do push — 26/10/2026

- Versionados frontend, catálogo/detalhes, melhorias dos CRUDs, módulo de demandas, migrations, testes e documentação. O fluxo de inscrições com análise continua apenas proposto, sem implementação.
- `.env` e suas cópias/variantes ignorados nos dois repositórios; somente `.env.example` com configurações de exemplo é permitido. Chaves privadas também são ignoradas. Dumps do banco não são versionados.
- Senha padrão removida do seed de demonstração e do script visual. Agora exigem senha definida no ambiente; nenhuma senha é impressa nos logs.
- Seeds restritos ao banco local `acao_social`, fora de produção, com validação de senha antes de acessar/modificar dados. Continuam opcionais e manuais; não foram executados nesta publicação.
- Porta do PostgreSQL no Compose limitada a `127.0.0.1`, para uso local. Alterar o Compose não recria automaticamente um container já em execução.
- Dependências corrigidas com `npm audit fix`, sem `--force`; lockfiles incluídos. Resultado da consulta nesta data: zero vulnerabilidades reportadas pelo npm nos dois repositórios. Esse resultado não substitui uma auditoria completa da aplicação.
- Backend: 41 testes funcionais e 3 verificações dos seeds aprovados; TypeScript e build aprovados.
- Frontend: 18 testes, TypeScript, build e ESLint aprovados.
- Integração PostgreSQL após atualizar o Prisma: 8 cenários aprovados e o agrupador aprovado (9 resultados), em schema temporário removido ao final.

Os cadastros locais e as credenciais do ambiente não fazem parte dos commits. Os testes de integração não alteram os cadastros reais. Nenhuma carga automática de dados foi adicionada.
