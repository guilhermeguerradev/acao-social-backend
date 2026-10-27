const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');

// Replace the Prisma module before importing services: no Pool, env file or database is used.
const prisma = {};
const prismaPath = require.resolve('../dist/config/prisma');
require.cache[prismaPath] = { id: prismaPath, filename: prismaPath, loaded: true, exports: { prisma } };
const jwtPath = require.resolve('../dist/utils/jwt');
require.cache[jwtPath] = { id: jwtPath, filename: jwtPath, loaded: true, exports: {
  verifyToken: token => { if (token !== 'valid') throw new Error('Invalid token'); return { userId: 'user' }; },
} };

const { BeneficiarioService } = require('../dist/modules/beneficiario/beneficiario.service');
const { ConsultaService } = require('../dist/modules/consulta/consulta.service');
const { AulaService } = require('../dist/modules/aula/aula.service');
const { MatriculaService } = require('../dist/modules/matricula/matricula.service');
const { UserService } = require('../dist/modules/user/user.service');
const { parseListQuery } = require('../dist/utils/listQuery');
const { updateBeneficiarioSchema } = require('../dist/modules/beneficiario/beneficiario.schema');
const { errorMiddleware } = require('../dist/middlewares/error.middleware');
const uuid = '11111111-1111-4111-8111-111111111111';
const future = new Date(Date.now() + 86400000);
const knownError = code => new Prisma.PrismaClientKnownRequestError('Test error', { code, clientVersion: 'test' });
const status = code => error => error.statusCode === code;
const beneficiary = new BeneficiarioService();
const consultation = new ConsultaService();
const lesson = new AulaService();
const enrollment = new MatriculaService();
const users = new UserService();

beforeEach(() => {
  for (const model of ['beneficiario', 'consulta', 'aula', 'matricula', 'user']) {
    prisma[model] = {
      findUnique: async () => ({ id: uuid }),
      findFirst: async () => null,
      findMany: async () => [],
      count: async () => 0,
      update: async ({ data }) => ({ id: uuid, ...data }),
      create: async ({ data }) => ({ id: uuid, ...data }),
      delete: async () => ({ id: uuid }),
    };
  }
  prisma.consulta.findUnique = async () => ({ id: uuid, medicoId: 'owner' });
  prisma.aula.findUnique = async () => ({ id: uuid, instrutorId: 'owner', vagas: 2, _count: { matriculas: 2 } });
  prisma.matricula.findUnique = async () => ({ id: uuid, aulaId: uuid, beneficiarioId: uuid });
  prisma.$transaction = async input => typeof input === 'function' ? input(prisma) : Promise.all(input);
  prisma.$queryRaw = async () => [{ id: uuid }];
});

test('beneficiary update preserves identity and forwards only editable fields', async () => {
  let received;
  prisma.beneficiario.update = async args => { received = args; return { id: uuid, ...args.data }; };
  const updated = await beneficiary.update(uuid, { name: 'Ana', telefone: '' });
  assert.equal(updated.id, uuid);
  assert.deepEqual(received.data, { name: 'Ana', telefone: '' });
  assert.equal(received.select.password, undefined);
});
test('beneficiary update returns 404 without creating a record', async () => {
  prisma.beneficiario.findUnique = async () => null;
  prisma.beneficiario.update = async () => assert.fail('must not update');
  await assert.rejects(beneficiary.update(uuid, { name: 'Ana' }), status(404));
});
test('beneficiary schema rejects empty names, IDs, unknown fields and empty updates', () => {
  for (const body of [{ name: '  ' }, { id: uuid }, { password: 'secret' }, {}]) assert.equal(updateBeneficiarioSchema.safeParse(body).success, false);
  assert.deepEqual(updateBeneficiarioSchema.parse({ name: ' Ana ' }), { name: 'Ana' });
});
test('beneficiary search and pagination run in the database with deterministic ordering', async () => {
  let args;
  prisma.beneficiario.findMany = async input => { args = input; return [{ id: uuid }]; };
  prisma.beneficiario.count = async ({ where }) => { assert.equal(where.name.contains, 'ana'); return 45; };
  const result = await beneficiary.findAll({ search: ' ana ', page: '2', limit: '20' });
  assert.equal(args.where.name.mode, 'insensitive');
  assert.equal(args.skip, 20);
  assert.equal(args.take, 20);
  assert.equal(args.orderBy[1].id, 'asc');
  assert.equal(result.total, 45);
  assert.equal(result.totalPages, 3);
});
test('pagination defaults and query validation reject invalid inputs', () => {
  assert.deepEqual(parseListQuery('beneficiario', {}), { page: 1, limit: 20 });
  for (const query of [{ page: 0 }, { page: 'abc' }, { page: 1.5 }, { limit: 101 }, { limit: 0 }, { search: ['a', 'b'] }]) {
    assert.throws(() => parseListQuery('beneficiario', query), status(400));
  }
  assert.throws(() => parseListQuery('consulta', { medicoId: 'invalid' }), status(400));
  assert.throws(() => parseListQuery('consulta', { startDate: '2027-02-01T00:00:00Z', endDate: '2027-01-01T00:00:00Z' }), status(400));
  assert.throws(() => parseListQuery('aula', { available: 'yes' }), status(400));
});
test('rescheduling denies another doctor and missing ownership', async () => {
  await assert.rejects(consultation.update(uuid, future, 'other'), status(403));
  await assert.rejects(consultation.update(uuid, future), status(403));
});
test('rescheduling rejects past dates and invalid dates', async () => {
  await assert.rejects(consultation.update(uuid, new Date(0), 'owner'), status(400));
  await assert.rejects(consultation.update(uuid, new Date('invalid'), 'owner'), status(400));
});
test('rescheduling rejects conflicts but excludes the current consultation', async () => {
  prisma.consulta.findFirst = async ({ where }) => { assert.equal(where.NOT.id, uuid); return { id: 'conflict' }; };
  await assert.rejects(consultation.update(uuid, future, 'owner'), status(409));
});
test('rescheduling converts a uniqueness race to 409 and accepts a free time', async () => {
  const result = await consultation.update(uuid, future, 'owner');
  assert.equal(result.dataHora, future);
  prisma.consulta.update = async () => { throw knownError('P2002'); };
  await assert.rejects(consultation.update(uuid, future, 'owner'), status(409));
});
test('consultation combines doctor, beneficiary, date range and pagination', async () => {
  prisma.consulta.findMany = async ({ where, skip }) => {
    assert.equal(where.medicoId, uuid); assert.equal(where.beneficiarioId, uuid);
    assert.ok(where.dataHora.gte instanceof Date); assert.ok(where.dataHora.lte instanceof Date); assert.equal(skip, 10);
    return [];
  };
  await consultation.findAll({ medicoId: uuid, beneficiarioId: uuid, startDate: '2027-01-01T00:00:00Z', endDate: '2027-01-02T00:00:00Z', page: 2, limit: 10 });
});
test('lesson update denies other instructors and transfer of ownership', async () => {
  await assert.rejects(lesson.update(uuid, { titulo: 'Yoga' }, 'other'), status(403));
  await assert.rejects(lesson.update(uuid, { titulo: 'Yoga' }), status(403));
  await assert.rejects(lesson.update(uuid, { instrutorId: 'other' }, 'owner'), status(403));
});
test('lesson capacity cannot fall below enrollment count; equal capacity is valid', async () => {
  await assert.rejects(lesson.update(uuid, { vagas: 1 }, 'owner'), status(400));
  let data;
  prisma.aula.update = async input => { data = input.data; return data; };
  await lesson.update(uuid, { vagas: 2, titulo: 'Yoga' }, 'owner');
  assert.equal(data.vagas, 2); assert.equal(data.matriculas, undefined); assert.equal(data.instrutorId, undefined);
});
test('lesson filters combine availability, instructor, modality and count', async () => {
  prisma.$queryRaw = async (strings, available) => { assert.equal(available, true); return [{ id: uuid }]; };
  prisma.aula.findMany = async ({ where }) => {
    assert.equal(where.instrutorId, uuid); assert.equal(where.modalidade.contains, 'Yoga'); assert.deepEqual(where.id.in, [uuid]); return [];
  };
  prisma.aula.count = async ({ where }) => { assert.deepEqual(where.id.in, [uuid]); return 21; };
  const result = await lesson.findAll({ instrutorId: uuid, modalidade: 'Yoga', available: 'true' });
  assert.equal(result.totalPages, 2);
});
test('enrollment update validates beneficiary and lesson existence', async () => {
  prisma.beneficiario.findUnique = async () => null;
  await assert.rejects(enrollment.update(uuid, { beneficiarioId: 'missing' }), status(404));
  prisma.beneficiario.findUnique = async () => ({ id: uuid });
  prisma.aula.findUnique = async () => null;
  await assert.rejects(enrollment.update(uuid, { aulaId: 'missing' }), status(404));
});
test('enrollment cannot move to a full lesson but may remain in its current full lesson', async () => {
  await assert.rejects(enrollment.update(uuid, { aulaId: 'different' }), status(400));
  const result = await enrollment.update(uuid, { aulaId: uuid, beneficiarioId: 'another' });
  assert.equal(result.beneficiarioId, 'another');
});
test('duplicate enrollments return conflict and do not create a replacement record', async () => {
  prisma.matricula.update = async () => { throw knownError('P2002'); };
  prisma.matricula.create = async () => assert.fail('update must not create');
  await assert.rejects(enrollment.update(uuid, { beneficiarioId: 'duplicate' }), status(409));
});
test('enrollment creation rejects a full lesson and uses serializable isolation', async () => {
  let isolation;
  prisma.$transaction = async (fn, options) => { isolation = options.isolationLevel; return fn(prisma); };
  await assert.rejects(enrollment.create({ beneficiarioId: uuid, aulaId: uuid }), status(400));
  assert.equal(isolation, 'Serializable');
});
test('enrollment pagination and lesson filter share the same total predicate', async () => {
  prisma.matricula.findMany = async ({ where, skip, take }) => { assert.equal(where.aulaId, uuid); assert.equal(skip, 100); assert.equal(take, 100); return []; };
  prisma.matricula.count = async ({ where }) => { assert.equal(where.aulaId, uuid); return 105; };
  const result = await enrollment.findAll({ aulaId: uuid, page: 2, limit: 100 });
  assert.equal(result.totalPages, 2);
});
test('user and beneficiary deletion distinguish dependencies from missing records', async () => {
  prisma.user.delete = async () => { throw knownError('P2003'); };
  prisma.beneficiario.delete = async () => { throw knownError('P2003'); };
  await assert.rejects(users.delete(uuid), status(409));
  await assert.rejects(beneficiary.delete(uuid), status(409));
  prisma.user.findUnique = async () => null;
  await assert.rejects(users.delete(uuid), status(404));
});

// Exercise the real Express routes, validators, auth and controllers over HTTP.
const express = require('express');
const app = express();
app.use(express.json());
for (const resource of ['beneficiario', 'consulta', 'aula', 'matricula', 'user']) {
  app.use('/' + resource, require('../dist/modules/' + resource + '/' + resource + '.routes').default);
}
app.use(errorMiddleware);
let server;
async function request(url, body, token) {
  if (!server) {
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  }
  return fetch('http://127.0.0.1:' + server.address().port + url, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body),
  });
}
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });
test('HTTP beneficiary update requires valid JWT and returns validation errors', async () => {
  assert.equal((await request('/beneficiario/' + uuid, { name: 'Ana' })).status, 401);
  assert.equal((await request('/beneficiario/' + uuid, { name: 'Ana' }, 'invalid')).status, 401);
  prisma.user.findUnique = async () => ({ id: 'user', medico: null, instrutor: null });
  assert.equal((await request('/beneficiario/' + uuid, { id: 'changed' }, 'valid')).status, 400);
  const response = await request('/beneficiario/' + uuid, { name: 'Ana' }, 'valid');
  assert.equal(response.status, 200); assert.equal((await response.json()).name, 'Ana');
});
test('HTTP protected updates deny users without the required role', async () => {
  prisma.user.findUnique = async () => ({ id: 'user', medico: null, instrutor: null });
  for (const resource of ['consulta', 'aula', 'user']) assert.equal((await request('/' + resource + '/' + uuid, {}, 'valid')).status, 403);
});
test('HTTP doctor cannot reschedule another doctor consultation', async () => {
  prisma.user.findUnique = async () => ({ id: 'user', medico: { id: 'other' }, instrutor: null });
  assert.equal((await request('/consulta/' + uuid, { dataHora: future.toISOString() }, 'valid')).status, 403);
});
