require('dotenv').config({ quiet: true });
const { createHash } = require('node:crypto');
const { Pool } = require('pg');
const { PrismaClient, Prisma } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

// This seed adds labelled demonstration records; it never deletes or overwrites records.
function demoId(resource, index) {
  const hex = createHash('sha256').update('acao-social-local-demo-v1:' + resource + ':' + index).digest('hex');
  return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-4' + hex.slice(13, 16) + '-a' + hex.slice(17, 20) + '-' + hex.slice(20, 32);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL ausente');
  const target = new URL(connectionString);
  if (!['localhost', '127.0.0.1'].includes(target.hostname) || process.env.NODE_ENV === 'production') {
    throw new Error('O seed de demonstracao e permitido somente em desenvolvimento e PostgreSQL local.');
  }
  if (target.pathname !== '/acao_social') throw new Error('O banco local esperado e acao_social. Nenhum dado foi alterado.');

  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Defina DEMO_PASSWORD com pelo menos 12 caracteres e no maximo 72 bytes. Nao existe senha padrao. Nenhum dado foi alterado.');
  }
  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const hash = await bcrypt.hash(password, 12);
  const firstNames = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Hugo', 'Isabela', 'Joao', 'Lara', 'Marcos', 'Nina', 'Otavio'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Costa', 'Pereira', 'Almeida', 'Ribeiro', 'Martins'];
  const activities = [
    ['Bombeiro Mirim', 'Atividade educativa'], ['Yoga para iniciantes', 'Yoga'],
    ['Pilates funcional', 'Pilates'], ['Danca de salao', 'Danca'],
    ['Informatica basica', 'Tecnologia'], ['Artesanato', 'Artes'],
    ['Capoeira', 'Esporte'], ['Alongamento', 'Atividade fisica'],
    ['Horta comunitaria', 'Atividade educativa'], ['Musica em grupo', 'Musica'],
  ];
  const requests = [
    'Gostaria de orientacao para conhecer as atividades disponiveis.',
    'Preciso de apoio para organizar minha participacao nas atividades do projeto.',
    'Gostaria de conversar com a equipe sobre minha solicitacao de apoio.',
    'Solicito orientacao sobre os atendimentos oferecidos pelo projeto social.',
    'Preciso de orientacao sobre o cadastro de um beneficiario.',
  ];

  try {
    const summary = await prisma.$transaction(async tx => {
      const counts = {};
      const models = ['user', 'medico', 'instrutor', 'beneficiario', 'consulta', 'aula', 'matricula', 'demand'];
      for (const model of models) counts[model] = { before: await tx[model].count() };

      const users = [];
      for (let index = 0; index < 14; index++) {
        const group = index < 4 ? 'medico' : index < 8 ? 'instrutor' : 'solicitante';
        const number = index < 4 ? index + 1 : index < 8 ? index - 3 : index - 7;
        const email = group + (number === 1 ? '' : number) + '.demo@example.test';
        const id = demoId('user', index);
        const collision = await tx.user.findUnique({ where: { email }, select: { id: true } });
        if (collision && collision.id !== id) throw new Error('Uma conta existente ja usa um email reservado para demonstracao. Nenhum dado sera alterado.');
        users.push(await tx.user.upsert({
          where: { id }, update: {},
          create: { id, name: firstNames[index] + ' ' + (group === 'medico' ? 'Medico' : group === 'instrutor' ? 'Instrutor' : 'Solicitante') + ' [DEMO]', email, password: hash },
          select: { id: true },
        }));
      }

      const doctors = [], instructors = [];
      for (let index = 0; index < 4; index++) {
        doctors.push(await tx.medico.upsert({ where: { userId: users[index].id }, update: {}, create: { id: demoId('medico', index), userId: users[index].id } }));
        instructors.push(await tx.instrutor.upsert({ where: { userId: users[index + 4].id }, update: {}, create: { id: demoId('instrutor', index), userId: users[index + 4].id } }));
      }

      const beneficiaries = Array.from({ length: 140 }, (_, index) => ({
        id: demoId('beneficiario', index),
        name: firstNames[index % firstNames.length] + ' ' + lastNames[Math.floor(index / firstNames.length) % lastNames.length] + ' [DEMO ' + String(index + 1).padStart(3, '0') + ']',
        telefone: index % 9 === 0 ? null : '0000000' + String(index + 1).padStart(4, '0'),
      }));
      await tx.beneficiario.createMany({ data: beneficiaries, skipDuplicates: true });

      const lessons = Array.from({ length: 30 }, (_, index) => ({
        id: demoId('aula', index),
        titulo: activities[index % activities.length][0] + (index >= 10 ? ' - Turma ' + (Math.floor(index / 10) + 1) : '') + ' [DEMO]',
        modalidade: activities[index % activities.length][1],
        vagas: 6 + (index % 5) * 3,
        instrutorId: instructors[index % instructors.length].id,
      }));
      await tx.aula.createMany({ data: lessons, skipDuplicates: true });

      for (let index = 0; index < lessons.length; index++) {
        const current = await tx.aula.findUnique({
          where: { id: lessons[index].id },
          select: { vagas: true, _count: { select: { matriculas: true } }, matriculas: { select: { beneficiarioId: true } } },
        });
        const desired = index % 4 === 0 ? current.vagas : index % 4 === 1 ? Math.ceil(current.vagas / 2) : index % 4 === 2 ? current.vagas - 1 : 0;
        let remaining = Math.max(0, Math.min(desired - current._count.matriculas, current.vagas - current._count.matriculas));
        const existing = new Set(current.matriculas.map(row => row.beneficiarioId));
        const enrollments = [];
        for (let offset = 0; offset < beneficiaries.length && remaining > 0; offset++) {
          const beneficiaryId = beneficiaries[(index * 7 + offset) % beneficiaries.length].id;
          if (existing.has(beneficiaryId)) continue;
          enrollments.push({ id: demoId('matricula', index + ':' + beneficiaryId), beneficiarioId: beneficiaryId, aulaId: lessons[index].id });
          remaining--;
        }
        if (enrollments.length) await tx.matricula.createMany({ data: enrollments, skipDuplicates: true });
      }

      const base = new Date();
      base.setUTCHours(12, 0, 0, 0);
      base.setUTCDate(base.getUTCDate() + 1);
      const appointments = Array.from({ length: 90 }, (_, index) => ({
        id: demoId('consulta', index), medicoId: doctors[index % doctors.length].id,
        beneficiarioId: beneficiaries[index % beneficiaries.length].id,
        dataHora: new Date(base.getTime() + Math.floor(index / 12) * 86400000 + Math.floor((index % 12) / 4) * 1800000),
      }));
      await tx.consulta.createMany({ data: appointments, skipDuplicates: true });

      await tx.demand.createMany({
        data: Array.from({ length: 65 }, (_, index) => ({
          id: demoId('demand', index), requestKey: demoId('request-key', index),
          requesterId: users[index % 6 + 8].id,
          description: '[DEMO ' + String(index + 1).padStart(3, '0') + '] ' + requests[index % requests.length],
          createdAt: new Date(Date.now() - index * 1800000),
        })),
        skipDuplicates: true,
      });

      const overbooked = await tx.$queryRaw`
        SELECT COUNT(*)::int AS count FROM "Aula" a
        WHERE a."id" = ANY(${lessons.map(lesson => lesson.id)}::text[])
          AND (SELECT COUNT(*) FROM "Matricula" m WHERE m."aulaId" = a."id") > a."vagas"
      `;
      if (overbooked[0].count > 0) throw new Error('Lotacao invalida: a transacao sera revertida.');
      for (const model of models) counts[model].after = await tx[model].count();
      return counts;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60000 });

    console.log('Dados [DEMO] inseridos no banco local ' + target.hostname + ':' + target.port + target.pathname);
    for (const [model, count] of Object.entries(summary)) console.log(model + ': ' + count.before + ' -> ' + count.after + ' (+' + (count.after - count.before) + ')');
    console.log('Nenhum registro existente foi apagado ou atualizado.');
    console.log('Contas iniciais: medico.demo@example.test, instrutor.demo@example.test, solicitante.demo@example.test');
    console.log('Senha inicial definida no ambiente, sem exibicao em logs.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(error => { console.error('Seed de demonstracao falhou: ' + error.message); process.exitCode = 1; });
