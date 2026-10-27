const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

// Explicit opt-in; this suite never loads the application's .env or touches public tables.
const connectionString = process.env.DEMAND_TEST_DATABASE_URL;
test('real PostgreSQL demand persistence, authentication, isolation and retries', { skip: !connectionString }, async t => {
  const target = new URL(connectionString);
  assert.ok(['localhost', '127.0.0.1'].includes(target.hostname), 'Integration tests require a local database');
  const { Pool, Client } = require('pg');
  const { PrismaClient } = require('@prisma/client');
  const { PrismaPg } = require('@prisma/adapter-pg');
  const schema = 'demand_test_' + randomUUID().replaceAll('-', '');
  const legacyUserId = randomUUID();
  const legacyDemandId = randomUUID();
  const admin = new Client({ connectionString });
  let pool, prisma, server;
  await admin.connect();
  try {
    await admin.query('CREATE SCHEMA "' + schema + '"');
    await admin.query('SET search_path TO "' + schema + '"');
    const migrations = path.join(__dirname, '../prisma/migrations');
    for (const name of fs.readdirSync(migrations).sort()) {
      const migration = path.join(migrations, name, 'migration.sql');
      if (name === '20261026010000_extend_demand_fields') {
        await admin.query('INSERT INTO "User" (id,name,email,password,"updatedAt") VALUES ($1,$2,$3,$4,NOW())', [legacyUserId, 'Legacy', 'legacy@example.test', 'unused']);
        await admin.query('INSERT INTO "Demand" (id,description,"requesterId","requestKey") VALUES ($1,$2,$3,$4)', [legacyDemandId, 'Legacy demand without consent', legacyUserId, randomUUID()]);
      }
      if (fs.existsSync(migration)) await admin.query(fs.readFileSync(migration, 'utf8'));
    }
    pool = new Pool({ connectionString, options: '-c search_path=' + schema });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
    const prismaPath = require.resolve('../dist/config/prisma');
    require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: { prisma } };
    process.env.JWT_SECRET = 'isolated-demand-integration-test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    const jwt = require('jsonwebtoken');
    const users = [];
    for (const name of ['Owner', 'Other', 'Doctor', 'Instructor']) {
      users.push(await prisma.user.create({ data: { name, email: name.toLowerCase() + '@example.test', password: 'unused-in-isolated-test' } }));
    }
    await prisma.medico.create({ data: { userId: users[2].id } });
    await prisma.instrutor.create({ data: { userId: users[3].id } });
    const tokens = users.map(user => jwt.sign({ userId: user.id }, process.env.JWT_SECRET));
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use('/demandas', require('../dist/modules/demanda/demanda.routes').default);
    app.use(require('../dist/middlewares/error.middleware').errorMiddleware);
    server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
    const url = 'http://127.0.0.1:' + server.address().port + '/demandas';
    const request = (suffix = '', token = tokens[0], options = {}) => fetch(url + suffix, {
      ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    });
    const post = (payload, token) => request('', token, { method: 'POST', body: JSON.stringify(payload) });
    const payload = { description: 'Preciso de apoio', requestKey: randomUUID(), phone: '+55 (11) 90000-0042', neighborhood: 'Jardim Esperança', returnPreference: 'WHATSAPP', category: 'FOOD', urgent: false, contactConsent: true };
    let received;

    await t.test('additive migration preserves legacy demands without fabricating consent or contact fields', async () => {
      const legacy = await prisma.demand.findUnique({ where: { id: legacyDemandId } });
      assert.equal(legacy.description, 'Legacy demand without consent');
      for (const field of ['phone', 'neighborhood', 'category', 'urgent', 'returnPreference', 'otherDescription', 'contactConsentAt', 'contactConsentText', 'contactConsentVersion']) assert.equal(legacy[field], null, field);
      const legacyToken = jwt.sign({ userId: legacyUserId }, process.env.JWT_SECRET);
      const fetched = await (await request('/' + legacyDemandId, legacyToken)).json();
      assert.equal(fetched.contactConsentAt, null); assert.equal(fetched.id, legacyDemandId);
    });

    await t.test('invalid credentials and invalid descriptions cannot persist demands', async () => {
      assert.equal((await request('', null)).status, 401);
      assert.equal((await request('', 'invalid')).status, 401);
      for (const description of [' ', 'a'.repeat(2001)]) assert.equal((await post({ ...payload, description })).status, 400);
      assert.equal((await post({ ...payload, requesterId: users[1].id })).status, 400);
      assert.equal((await post({ ...payload, contactConsent: false })).status, 400);
      assert.equal((await post({ ...payload, category: 'OTHER' })).status, 400);
      assert.equal((await post({ ...payload, phone: '123' })).status, 400);
      assert.equal(await prisma.demand.count(), 1);
    });
    await t.test('options accept valid JWTs and reject expired, differently signed and unknown-account sessions', async () => {
      const valid = await request('/options', tokens[0]);
      assert.equal(valid.status, 200);
      assert.ok(Array.isArray((await valid.json()).categories));
      const invalidTokens = [
        jwt.sign({ userId: users[0].id, exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET),
        jwt.sign({ userId: users[0].id }, 'different-isolated-test-secret'),
        jwt.sign({ userId: randomUUID() }, process.env.JWT_SECRET),
      ];
      for (const token of invalidTokens) {
        const response = await request('/options', token);
        assert.equal(response.status, 401);
        assert.equal((await response.json()).error, 'Nao autorizado');
      }
    });
    await t.test('confirmed submission is persisted with the real authenticated user and received status', async () => {
      const response = await post(payload);
      assert.equal(response.status, 201); received = await response.json();
      assert.equal(received.requesterId, users[0].id); assert.equal(received.status, 'RECEIVED');
      assert.equal(received.requester.password, undefined); assert.equal(received.requester.email, undefined);
      assert.equal(received.requestKey, undefined);
      const persisted = await prisma.demand.findUnique({ where: { id: received.id } });
      assert.equal(persisted.description, payload.description); assert.equal(persisted.status, 'RECEIVED');
      assert.equal(persisted.phone, '11900000042'); assert.equal(persisted.neighborhood, payload.neighborhood);
      assert.equal(persisted.contactConsentVersion, 'contact-v1'); assert.ok(persisted.contactConsentAt instanceof Date);
      assert.equal(persisted.contactConsentText, 'Autorizo o uso dos dados informados para análise e contato sobre esta solicitação.');
    });
    await t.test('sequential and concurrent retries do not create duplicate records', async () => {
      const retry = await post(payload); assert.equal(retry.status, 200); assert.equal((await retry.json()).id, received.id);
      assert.equal(await prisma.demand.count(), 2);
      const concurrent = { ...payload, description: 'Outro apoio', requestKey: randomUUID() };
      const results = await Promise.all([post(concurrent), post(concurrent)]);
      assert.deepEqual(results.map(r => r.status).sort(), [200, 201]);
      const data = await Promise.all(results.map(r => r.json())); assert.equal(data[0].id, data[1].id);
      assert.equal(await prisma.demand.count(), 3);
      assert.equal((await post({ ...payload, description: 'Conteudo modificado' })).status, 409);
      for (const patch of [{ phone: '21900000042' }, { urgent: true }, { category: 'HEALTH' }, { returnPreference: 'PHONE_CALL' }, { neighborhood: 'Centro' }]) assert.equal((await post({ ...payload, ...patch })).status, 409);
      assert.equal((await post({ ...payload, phone: '11900000042' })).status, 200);
      const again = await prisma.demand.findUnique({ where: { id: received.id } });
      assert.equal(again.contactConsentAt.toISOString(), received.contactConsentAt);
    });
    await t.test('requesters see only their own data, even with forged role claims', async () => {
      const other = await post({ ...payload, description: 'Apoio de outro solicitante', requestKey: randomUUID() }, tokens[1]);
      assert.equal(other.status, 201); const otherDemand = await other.json();
      const listed = await (await request()).json();
      assert.equal(listed.total, 2); assert.ok(listed.data.every(demand => demand.requesterId === users[0].id));
      assert.equal((await request('/' + otherDemand.id)).status, 404);
      const forged = jwt.sign({ userId: users[0].id, role: 'MEDICO' }, process.env.JWT_SECRET);
      assert.equal((await request('/' + otherDemand.id, forged)).status, 404);
      assert.equal((await request('?requesterId=' + users[1].id)).status, 400);
    });
    await t.test('both professional profiles can list and inspect all received demands', async () => {
      for (const token of tokens.slice(2)) {
        assert.equal((await (await request('', token)).json()).total, 4);
        assert.equal((await request('/' + received.id, token)).status, 200);
      }
    });
    await t.test('search matches real database data while preserving requester privacy', async () => {
      const suffix = '?search=' + encodeURIComponent('outro solicitante');
      assert.equal((await (await request(suffix)).json()).total, 0);
      const professional = await (await request(suffix, tokens[2])).json();
      assert.equal(professional.total, 1);
      assert.equal(professional.data[0].requesterId, users[1].id);
      assert.equal((await request('?search=' + 'x'.repeat(121))).status, 400);
    });
    await t.test('pagination and foreign keys preserve the approved relationships', async () => {
      const page = await (await request('?page=2&limit=1', tokens[2])).json();
      assert.equal(page.data.length, 1); assert.equal(page.total, 4); assert.equal(page.totalPages, 4);
      await assert.rejects(prisma.user.delete({ where: { id: users[0].id } }), error => error.code === 'P2003');
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
    // Only the unique schema created above is removed; public/application data is untouched.
    await admin.query('SET search_path TO public');
    await admin.query('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    await admin.end();
  }
});
