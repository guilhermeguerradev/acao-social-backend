# Ajustes visuais de demandas — 26/10/2026

## Implementado com o contrato atual

- Registro com seções, etapas, orientação lateral, contador, nome da conta e área de anexo desabilitada.
- Revisão com resumo lateral, edição e indicador de etapa; dados preservados.
- Confirmação com identificação real, cópia para a área de transferência, data real, próximos passos e aviso de que recebimento não é aprovação.
- Gestão com cartões, resumo de situação, busca no servidor por identificação, descrição ou solicitante, paginação, atualização e acesso aos detalhes.
- Detalhes com identificação copiável, resumo e orientação lateral.
- Layout responsivo e rodapé, reutilizando tokens, botões, cards e demais componentes existentes. As telas administrativas anteriores continuam disponíveis.

A disposição usa as imagens anexadas como referência, mas não se declara reprodução integral do Figma. Os campos adicionais de demanda aguardam aprovação do contrato final; as situações de andamento e atendimento não foram inventadas. Catálogo, detalhes de cursos e inscrições não foram modificados nesta rodada após a definição do escopo de demandas.

## Principais arquivos

- `acao-social-frontend/src/components/ui/flow-layout.tsx`
- `acao-social-frontend/src/components/ui/copy-button.tsx`
- `acao-social-frontend/src/components/demands/DemandForm.tsx`
- `acao-social-frontend/src/components/demands/DemandFlow.tsx`
- `acao-social-frontend/src/components/demands/DemandManagement.tsx`
- `acao-social-frontend/src/components/demands/DemandDetails.tsx`
- `acao-social-frontend/src/styles.css`
- `acao-social-frontend/src/App.tsx`
- `acao-social-frontend/tests/demands.test.mjs`
- `acao-social-frontend/scripts/preview-demands.mjs`
- `acao-social-frontend/.gitignore` (capturas locais em `.artifacts/`)
- `acao-social-backend/src/utils/listQuery.ts`
- `acao-social-backend/src/modules/demanda/demanda.service.ts`
- `acao-social-backend/tests/demands.test.cjs`
- `acao-social-backend/tests/demands.integration.cjs`

## Verificação

Backend: 37 testes aprovados, build e TypeScript aprovados. Frontend: 16 testes aprovados, build, TypeScript e ESLint aprovados. Integração PostgreSQL isolada: 7 cenários aprovados mais o teste agrupador (8 resultados), incluindo busca sem violação do escopo do solicitante.

Navegador Edge headless, sem dependência adicional: registro e revisão, preservação da descrição ao voltar, gestão, detalhes e viewport móvel de 390 px. Não houve rolagem horizontal no formulário móvel. O roteiro não confirmou envio e não criou nem alterou demandas.

Capturas de registro/revisão/gestão/detalhes e versão móvel foram salvas localmente em `acao-social-frontend/.artifacts/`. A confirmação tem seus fluxos cobertos pelos testes existentes, mas não foi capturada pelo roteiro de leitura do navegador.

## Próximas decisões

O contrato detalhado está em `CONTRATO_DEMANDAS_PARA_APROVACAO.md`. Nenhuma migration foi criada ou aplicada para os novos campos. Anexos ficam para outra entrega. A proposta de inscrições com análise está em `PROPOSTA_INSCRICOES_PARA_PROXIMA_ETAPA.md`; a implementação deve aguardar a conclusão e validação de demandas.

Não houve commit, push, deploy ou alteração do Figma.
