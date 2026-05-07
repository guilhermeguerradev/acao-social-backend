-- Prevent double-booking the same doctor at the same date/time.
CREATE UNIQUE INDEX "Consulta_medicoId_dataHora_key" ON "Consulta"("medicoId", "dataHora");

-- Speed up common relation lookups and list/detail joins.
CREATE INDEX "Consulta_beneficiarioId_idx" ON "Consulta"("beneficiarioId");
CREATE INDEX "Aula_instrutorId_idx" ON "Aula"("instrutorId");
CREATE INDEX "Matricula_aulaId_idx" ON "Matricula"("aulaId");
