# Iniciar com banco vazio

A aplicação não cria contas, cursos, beneficiários, demandas ou outros dados de demonstração ao iniciar.

Para um banco novo, configure o `.env` local e execute:

```powershell
npm install
npx prisma migrate deploy
npm run dev
```

Para executar o build:

```powershell
npm run build
npm start
```

As migrations criam e atualizam a estrutura, sem inserir cadastros fictícios. O `postinstall` apenas gera o cliente Prisma. Não execute `npm run seed`, `npm run seed:demo` nem importe os arquivos SQL de seed se deseja manter o banco sem exemplos. Esses utilitários são manuais e não participam da inicialização.

No frontend, acesse **Cadastro** para criar uma nova conta de médico ou instrutor com seus próprios dados. Depois entre em **Login** e cadastre os demais registros pela interface. Email e senha começam vazios; os exemplos aparecem apenas como placeholders. As contas de demonstração antigas deixam de funcionar quando são removidas do banco.

A limpeza solicitada em 26/10/2026 foi restrita ao banco local `acao_social`, preservando tabelas, constraints e o histórico de migrations. O conteúdo de um banco não faz parte de um commit Git. Clonar o projeto ou iniciar o servidor não executa limpeza nem importa dados automaticamente.
