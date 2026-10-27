const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const prisma = {};
const prismaPath = require.resolve('../dist/config/prisma');
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: { prisma } };
const jwtPath = require.resolve('../dist/utils/jwt');
require.cache[jwtPath] = { id: jwtPath, filename: jwtPath, loaded: true, exports: {
  verifyToken: token => { if (token !== 'valid') throw new Error('Invalid token'); return { userId: 'owner' }; },
} };
const { DemandService } = require('../dist/modules/demanda/demanda.service');
const { createDemandSchema } = require('../dist/modules/demanda/demanda.schema');
const service = new DemandService();
const key = '11111111-1111-4111-8111-111111111111';
const actor = { userId: 'owner', role: null };
const payload = { description: 'Apoio solicitado', requestKey: key, phone: '11900000042', neighborhood: 'Jardim Esperança', category: 'FOOD', returnPreference: 'WHATSAPP', urgent: false, contactConsent: true };
const row = { id: key, description: payload.description, phone: payload.phone, neighborhood: payload.neighborhood, category: payload.category, returnPreference: payload.returnPreference, urgent: false, otherDescription: null, contactConsentAt: new Date(), contactConsentText: 'Autorizo o uso dos dados informados para análise e contato sobre esta solicitação.', contactConsentVersion: 'contact-v1', status: 'RECEIVED', requesterId: 'owner', requester: { id: 'owner', name: 'Solicitante' }, createdAt: new Date() };
const status = code => error => error.statusCode === code;

beforeEach(() => {
  prisma.demand = {
    findUnique: async () => null,
    findFirst: async () => row,
    create: async () => row,
    findMany: async () => [row],
    count: async () => 1,
  };
  prisma.user = { findUnique: async () => ({ id: 'owner', medico: null, instrutor: null }) };
  prisma.$transaction = input => Promise.all(input);
});

test('demand schema trims description and enforces the approved bounds and technical key', () => {
  assert.equal(createDemandSchema.parse({ ...payload, description: ' Apoio ' }).description, 'Apoio');
  assert.equal(createDemandSchema.safeParse({ ...payload, description: 'a'.repeat(2000) }).success, true);
  for (const payload of [
    { description: ' ', requestKey: key }, { description: 'a'.repeat(2001), requestKey: key },
    { description: 'Apoio' }, { description: 'Apoio', requestKey: 'invalid' },
    { description: 'Apoio', requestKey: key, requesterId: 'other' },
    { description: 'Apoio', requestKey: key, status: 'APPROVED' },
  ]) assert.equal(createDemandSchema.safeParse(payload).success, false);
});

test('new demands require every approved field and explicit contact consent', () => {
  for (const field of Object.keys(payload)) {
    const incomplete = { ...payload }; delete incomplete[field];
    assert.equal(createDemandSchema.safeParse(incomplete).success, false, field);
  }
  for (const patch of [
    { contactConsent: false }, { contactConsent: 'true' }, { urgent: '' }, { urgent: 'false' },
    { category: 'UNKNOWN' }, { returnPreference: 'EMAIL' }, { neighborhood: ' ' },
    { neighborhood: 'a'.repeat(121) }, { requesterId: 'other' }, { name: 'Forged' },
    { status: 'APPROVED' }, { contactConsentVersion: 'forged' }, { contactConsentText: 'forged' },
  ]) assert.equal(createDemandSchema.safeParse({ ...payload, ...patch }).success, false, JSON.stringify(patch));
});
test('Brazilian phones accept formatting, country code and DDD 55 without losing digits', () => {
  for (const [phone, normalized] of [['+55 (11) 90000-0042', '11900000042'], ['(11) 3000-0042', '1130000042'], ['(55) 90000-0042', '55900000042']]) {
    assert.equal(createDemandSchema.parse({ ...payload, phone }).phone, normalized);
  }
  for (const phone of ['123', '(01) 90000-0042', '(11) 80000-0042', '(11) 1000-0042', '11900000042abc', '+1 202 555 0123']) {
    assert.equal(createDemandSchema.safeParse({ ...payload, phone }).success, false, phone);
  }
});
test('Other requires a bounded specification and other categories do not persist hidden text', () => {
  for (const otherDescription of ['', ' ', 'x'.repeat(201), null]) assert.equal(createDemandSchema.safeParse({ ...payload, category: 'OTHER', otherDescription }).success, false);
  assert.equal(createDemandSchema.parse({ ...payload, category: 'OTHER', otherDescription: ' Transporte ' }).otherDescription, 'Transporte');
  assert.equal(createDemandSchema.parse({ ...payload, otherDescription: 'Ignored hidden text' }).otherDescription, null);
});
test('demand creation stores the authenticated requester and preserves the default status', async () => {
  prisma.demand.create = async ({ data, select }) => {
    assert.equal(data.requesterId, 'owner'); assert.equal(data.description, row.description);
    assert.equal(data.status, undefined); assert.equal(select.requester.select.password, undefined);
    assert.equal(select.requester.select.email, undefined); assert.equal(select.requestKey, undefined);
    assert.ok(data.contactConsentAt instanceof Date);
    assert.equal(data.contactConsentVersion, 'contact-v1');
    assert.equal(data.contactConsentText, row.contactConsentText);
    assert.equal(data.phone, payload.phone); assert.equal(data.neighborhood, payload.neighborhood);
    assert.equal(data.contactConsent, undefined);
    return row;
  };
  const result = await service.create(payload, actor);
  assert.equal(result.created, true); assert.equal(result.demand.status, 'RECEIVED');
});
test('repeating a confirmed demand returns the same record without another write', async () => {
  prisma.demand.findUnique = async () => row;
  prisma.demand.create = async () => assert.fail('must not create a duplicate');
  const result = await service.create(payload, actor);
  assert.equal(result.created, false); assert.equal(result.demand.id, key);
});
test('an idempotency key cannot silently overwrite already received content', async () => {
  prisma.demand.findUnique = async () => row;
  for (const patch of [{ description: 'Outro texto' }, { phone: '21900000042' }, { neighborhood: 'Outro bairro' }, { category: 'CLOTHING' }, { returnPreference: 'PHONE_CALL' }, { urgent: true }]) {
    await assert.rejects(service.create({ ...payload, ...patch }, actor), status(409));
  }
  assert.equal((await service.create({ ...payload, phone: '+55 (11) 90000-0042', neighborhood: ' Jardim Esperança ' }, actor)).created, false);
});
test('concurrent duplicate demand creation recovers the persisted record', async () => {
  let reads = 0;
  prisma.demand.findUnique = async () => ++reads === 1 ? null : row;
  prisma.demand.create = async () => { throw new Prisma.PrismaClientKnownRequestError('Duplicate', { code: 'P2002', clientVersion: 'test' }); };
  const result = await service.create(payload, actor);
  assert.equal(result.created, false); assert.equal(result.demand, row);
});
test('failed persistence is propagated rather than producing a success confirmation', async () => {
  const failure = new Error('Storage unavailable');
  prisma.demand.create = async () => { throw failure; };
  await assert.rejects(service.create(payload, actor), error => error === failure);
});
test('ordinary users can list only their demands and cannot inject an owner filter', async () => {
  let listWhere;
  prisma.demand.findMany = async ({ where, skip, take, orderBy }) => {
    listWhere = where; assert.equal(where.requesterId, 'owner'); assert.equal(skip, 20); assert.equal(take, 20);
    assert.deepEqual(orderBy, [{ createdAt: 'desc' }, { id: 'asc' }]); return [row];
  };
  prisma.demand.count = async ({ where }) => { assert.deepEqual(where, listWhere); return 25; };
  const result = await service.findAll({ page: 2, limit: 20 }, actor);
  assert.equal(result.totalPages, 2);
  await assert.rejects(service.findAll({ requesterId: 'other' }, actor), status(400));
});
test('only the approved professional roles may query all demands', async () => {
  prisma.demand.findMany = async ({ where }) => { assert.deepEqual(where, {}); return [row]; };
  for (const role of ['MEDICO', 'INSTRUTOR']) await service.findAll({}, { userId: 'professional', role });
  prisma.demand.findMany = async ({ where }) => { assert.equal(where.requesterId, 'other'); return []; };
  await service.findAll({}, { userId: 'other', role: 'ADMIN' });
});

test('demand search combines text matches with the requester access scope', async () => {
  let predicate;
  prisma.demand.findMany = async ({ where }) => {
    predicate = where;
    assert.equal(where.requesterId, actor.userId);
    assert.equal(where.OR[0].id.contains, 'apoio');
    assert.equal(where.OR[1].description.contains, 'apoio');
    assert.equal(where.OR[2].requester.name.contains, 'apoio');
    assert.equal(where.OR[1].description.mode, 'insensitive');
    return [row];
  };
  prisma.demand.count = async ({ where }) => { assert.deepEqual(where, predicate); return 1; };
  assert.equal((await service.findAll({ search: ' apoio ' }, actor)).total, 1);
  await assert.rejects(service.findAll({ search: 'a'.repeat(121) }, actor), status(400));
});
test('demand details are scoped on the server and conceal other users records', async () => {
  prisma.demand.findFirst = async ({ where }) => {
    assert.deepEqual(where, { requesterId: 'owner', id: key }); return null;
  };
  await assert.rejects(service.findById(key, actor), status(404));
});
test('professional demand details do not require ownership', async () => {
  prisma.demand.findFirst = async ({ where }) => { assert.deepEqual(where, { id: key }); return row; };
  for (const role of ['MEDICO', 'INSTRUTOR']) assert.equal(await service.findById(key, { userId: 'professional', role }), row);
});
test('all demand service operations reject a missing authenticated identity', async () => {
  const missing = { userId: '', role: 'MEDICO' };
  await assert.rejects(service.create({ description: row.description, requestKey: key }, missing), status(401));
  await assert.rejects(service.findAll({}, missing), status(401));
  await assert.rejects(service.findById(key, missing), status(401));
});

const express = require('express');
const app = express();
app.use(express.json());
app.use('/demandas', require('../dist/modules/demanda/demanda.routes').default);
app.use(require('../dist/middlewares/error.middleware').errorMiddleware);
let server;
async function request(path = '', options = {}, authenticated = true) {
  if (!server) server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  return fetch('http://127.0.0.1:' + server.address().port + '/demandas' + path, {
    ...options, headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: 'Bearer valid' } : {}), ...options.headers },
  });
}
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });
test('HTTP demand routes require JWT for creation, list and details', async () => {
  for (const [path, method] of [['', 'POST'], ['', 'GET'], ['/' + key, 'GET']]) assert.equal((await request(path, { method }, false)).status, 401);
  assert.equal((await request('', { headers: { Authorization: 'Bearer invalid' } })).status, 401);
});
test('HTTP demand creation validates input, returns 201 and returns 200 on safe retry', async () => {
  const body = JSON.stringify(payload);
  assert.equal((await request('', { method: 'POST', body: JSON.stringify({ description: ' ' }) })).status, 400);
  const created = await request('', { method: 'POST', body });
  assert.equal(created.status, 201); assert.equal((await created.json()).requesterId, 'owner');
  prisma.demand.findUnique = async () => row;
  assert.equal((await request('', { method: 'POST', body })).status, 200);
});

test('HTTP options are authenticated and match the server schema and approved consent', async () => {
  assert.equal((await request('/options', {}, false)).status, 401);
  const response = await request('/options'); assert.equal(response.status, 200);
  const options = await response.json();
  assert.deepEqual(options.categories.map(option => option.value), ['FOOD', 'CLOTHING', 'HYGIENE', 'HEALTH', 'EDUCATION', 'SOCIAL_ASSISTANCE', 'OTHER']);
  assert.deepEqual(options.returnPreferences.map(option => option.value), ['WHATSAPP', 'PHONE_CALL']);
  assert.equal(options.consent.text, row.contactConsentText); assert.equal(options.consent.version, 'contact-v1');
  for (const option of options.categories) assert.equal(createDemandSchema.safeParse({ ...payload, category: option.value, otherDescription: option.value === 'OTHER' ? 'Outro apoio' : undefined }).success, true);
});

test('database failures during authentication are server errors, not invalid sessions', async () => {
  prisma.user.findUnique = async () => { throw new Prisma.PrismaClientKnownRequestError('Missing relation', { code: 'P2021', clientVersion: 'test', meta: { table: 'public.User' } }); };
  const response = await request('/options');
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Erro interno do servidor' });
});

test('demand database failures return a generic 500 without leaking query or schema details', async () => {
  prisma.demand.findMany = async () => { throw new Prisma.PrismaClientKnownRequestError('Missing column', { code: 'P2022', clientVersion: 'test', meta: { column: 'Demand.phone' } }); };
  const response = await request('?page=1');
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Erro interno do servidor' });
});
test('HTTP demand details validate identifiers, protect ownership and provide no status-update route', async () => {
  assert.equal((await request('/invalid')).status, 400);
  prisma.demand.findFirst = async () => null;
  assert.equal((await request('/' + key)).status, 404);
  assert.equal((await request('/' + key, { method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' }) })).status, 404);
});
