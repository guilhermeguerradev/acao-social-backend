-- Seed SQL for acao_social
-- Execute with psql variable: -v SEED_USER_PASSWORD="your-password"
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Users
INSERT INTO "User"(id, name, email, password, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Dr. Ana Silva', 'ana.med@gmail.com', crypt(:'SEED_USER_PASSWORD', gen_salt('bf')), now(), now()),
  (gen_random_uuid(), 'Dr. Bruno Costa', 'bruno.med@gmail.com', crypt(:'SEED_USER_PASSWORD', gen_salt('bf')), now(), now()),
  (gen_random_uuid(), 'Instrutora Carla Souza', 'carla.inst@gmail.com', crypt(:'SEED_USER_PASSWORD', gen_salt('bf')), now(), now()),
  (gen_random_uuid(), 'Instrutor Diego Lima', 'diego.inst@gmail.com', crypt(:'SEED_USER_PASSWORD', gen_salt('bf')), now(), now()),
  (gen_random_uuid(), 'Felipe Oliveira', 'felipe.user@gmail.com', crypt(:'SEED_USER_PASSWORD', gen_salt('bf')), now(), now()),
  (gen_random_uuid(), 'Gabriela Pereira', 'gabriela.user@gmail.com', crypt(:'SEED_USER_PASSWORD', gen_salt('bf')), now(), now())
ON CONFLICT (email) DO NOTHING;

-- Medicos
INSERT INTO "Medico"(id, "userId")
VALUES
  (gen_random_uuid(), (SELECT id FROM "User" WHERE email = 'ana.med@gmail.com')),
  (gen_random_uuid(), (SELECT id FROM "User" WHERE email = 'bruno.med@gmail.com'))
ON CONFLICT ("userId") DO NOTHING;

-- Instrutores
INSERT INTO "Instrutor"(id, "userId")
VALUES
  (gen_random_uuid(), (SELECT id FROM "User" WHERE email = 'carla.inst@gmail.com')),
  (gen_random_uuid(), (SELECT id FROM "User" WHERE email = 'diego.inst@gmail.com'))
ON CONFLICT ("userId") DO NOTHING;

-- Beneficiarios
INSERT INTO "Beneficiario"(id, name, telefone, "createdAt")
VALUES
  (gen_random_uuid(), 'Maria Santos', '11911112222', now()),
  (gen_random_uuid(), 'João Pereira', '11922223333', now()),
  (gen_random_uuid(), 'Lucas Almeida', '11933334444', now()),
  (gen_random_uuid(), 'Mariana Rocha', '11944445555', now()),
  (gen_random_uuid(), 'Rafael Gomes', '11955556666', now());

-- Aulas
INSERT INTO "Aula"(id, titulo, modalidade, vagas, "instrutorId", "createdAt")
VALUES
  (gen_random_uuid(), 'Yoga para Iniciantes', 'Yoga', 10, (SELECT id FROM "Instrutor" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'carla.inst@gmail.com')), now()),
  (gen_random_uuid(), 'Pilates Funcional', 'Pilates', 12, (SELECT id FROM "Instrutor" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'carla.inst@gmail.com')), now()),
  (gen_random_uuid(), 'Dança de Salão', 'Dança', 15, (SELECT id FROM "Instrutor" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'diego.inst@gmail.com')), now()),
  (gen_random_uuid(), 'Musculação Adaptada', 'Musculação', 8, (SELECT id FROM "Instrutor" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'diego.inst@gmail.com')), now());

-- Consultas
INSERT INTO "Consulta"(id, "dataHora", "medicoId", "beneficiarioId", "createdAt")
VALUES
  (gen_random_uuid(), now() + interval '1 day', (SELECT id FROM "Medico" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'ana.med@gmail.com')), (SELECT id FROM "Beneficiario" WHERE name = 'Maria Santos'), now()),
  (gen_random_uuid(), now() + interval '2 day', (SELECT id FROM "Medico" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'ana.med@gmail.com')), (SELECT id FROM "Beneficiario" WHERE name = 'João Pereira'), now()),
  (gen_random_uuid(), now() + interval '3 day', (SELECT id FROM "Medico" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'bruno.med@gmail.com')), (SELECT id FROM "Beneficiario" WHERE name = 'Lucas Almeida'), now()),
  (gen_random_uuid(), now() + interval '4 day', (SELECT id FROM "Medico" WHERE "userId" = (SELECT id FROM "User" WHERE email = 'bruno.med@gmail.com')), (SELECT id FROM "Beneficiario" WHERE name = 'Mariana Rocha'), now());

-- Matriculas
INSERT INTO "Matricula"(id, "beneficiarioId", "aulaId", "createdAt")
VALUES
  (gen_random_uuid(), (SELECT id FROM "Beneficiario" WHERE name = 'Maria Santos'), (SELECT id FROM "Aula" WHERE titulo = 'Yoga para Iniciantes'), now()),
  (gen_random_uuid(), (SELECT id FROM "Beneficiario" WHERE name = 'João Pereira'), (SELECT id FROM "Aula" WHERE titulo = 'Yoga para Iniciantes'), now()),
  (gen_random_uuid(), (SELECT id FROM "Beneficiario" WHERE name = 'Lucas Almeida'), (SELECT id FROM "Aula" WHERE titulo = 'Pilates Funcional'), now()),
  (gen_random_uuid(), (SELECT id FROM "Beneficiario" WHERE name = 'Mariana Rocha'), (SELECT id FROM "Aula" WHERE titulo = 'Dança de Salão'), now()),
  (gen_random_uuid(), (SELECT id FROM "Beneficiario" WHERE name = 'Rafael Gomes'), (SELECT id FROM "Aula" WHERE titulo = 'Musculação Adaptada'), now())
ON CONFLICT ("beneficiarioId", "aulaId") DO NOTHING;

COMMIT;
