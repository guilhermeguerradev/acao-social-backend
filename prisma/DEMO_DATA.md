# Dados locais de demonstração

Utilitário opcional e manual. **Não execute se deseja manter o banco vazio.** A inicialização normal não chama este script. Caso precise de demonstração local, defina uma senha própria em `DEMO_PASSWORD` (mínimo de 12 caracteres, máximo de 72 bytes) no ambiente antes de executar na pasta do backend:

```powershell
npm run seed:demo
```

A rotina aceita somente PostgreSQL em localhost/127.0.0.1, banco `acao_social`, fora de produção. Ela usa uma transação, IDs determinísticos e não apaga nem atualiza registros existentes. Não utilize o comando antigo `npm run seed` para preservar dados: o seed antigo contém exclusões.

Conjunto inicial: 14 contas, 4 médicos, 4 instrutores, 140 beneficiários, 30 aulas, 90 consultas futuras, 221 matrículas e 65 demandas. As aulas incluem exemplos vazios, parcialmente ocupados e lotados. Os nomes e as demandas trazem a identificação `[DEMO]`; os telefones são fictícios e não devem ser utilizados para contato.

| Perfil | Email |
| --- | --- |
| Médico | `medico.demo@example.test` |
| Instrutor | `instrutor.demo@example.test` |
| Solicitante, sem perfil profissional | `solicitante.demo@example.test` |

Não há senha padrão no código nem nesta documentação. `DEMO_PASSWORD` é obrigatória e não deve ser versionada. As senhas de contas já existentes não são alteradas em execuções posteriores. O script visual do frontend também exige essa variável.

Médicos e instrutores veem as 65 demandas; a primeira conta de solicitante vê somente suas 11 demandas. Cada médico/instrutor pode editar somente suas próprias consultas/aulas, conforme as regras atuais. Existem outras contas com sufixos numéricos (por exemplo, `medico2.demo@example.test`), com a mesma senha inicial.

O curso **Bombeiro Mirim [DEMO]** é apenas um cadastro fictício para navegação e testes. Não representa uma oferta real, currículo confirmado ou conclusão da pendência de cadastro real do projeto.

Repetir o seed no mesmo conjunto não duplica registros. Ele também não desfaz alterações manuais feitas nos dados de demonstração; poderá recompor matrículas ausentes até a ocupação planejada das aulas de demonstração, respeitando as vagas existentes.

Após inserir os dados, atualize o frontend e use a aba de cada módulo. Não houve migration nem alteração em produção para criar esse conjunto de demonstração.
