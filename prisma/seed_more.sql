-- Additional seed: more medicos and instrutores
-- Execute with psql variable: -v SEED_USER_PASSWORD="your-password"
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- Additional users (medicos/instrutores)
INSERT INTO "User"(id, name, email, password, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Dr. Eduardo Ramos', 'eduardo.med@gmail.com', crypt(:'SEED_USER_PASSWORD', gen_salt('bf')), now(), now()),
  (gen_random_uuid(), 'Dr. Fernanda Mello', 'fernanda.med@gmail.com', crypt(:'SEED_USER_PASSWORD', gen_salt('bf')), now(), now()),
  (gen_random_uuid(), 'Instrutor Gustavo Silva', 'gustavo.inst@gmail.com', crypt(:'SEED_USER_PASSWORD', gen_salt('bf')), now(), now()),
  (gen_random_uuid(), 'Instrutora Helena Costa', 'helena.inst@gmail.com', crypt(:'SEED_USER_PASSWORD', gen_salt('bf')), now(), now())
ON CONFLICT (email) DO NOTHING;

-- Create medicos for the two doctors
INSERT INTO "Medico"(id, "userId")
VALUES
  (gen_random_uuid(), (SELECT id FROM "User" WHERE email = 'eduardo.med@gmail.com')),
  (gen_random_uuid(), (SELECT id FROM "User" WHERE email = 'fernanda.med@gmail.com'))
ON CONFLICT ("userId") DO NOTHING;

-- Create instrutores for the two instructors
INSERT INTO "Instrutor"(id, "userId")
VALUES
  (gen_random_uuid(), (SELECT id FROM "User" WHERE email = 'gustavo.inst@gmail.com')),
  (gen_random_uuid(), (SELECT id FROM "User" WHERE email = 'helena.inst@gmail.com'))
ON CONFLICT ("userId") DO NOTHING;

COMMIT;
