import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { getRequiredEnv } from '../src/config/env'

const connectionString = getRequiredEnv('DATABASE_URL')
const seedTarget = new URL(connectionString)
if (!['localhost', '127.0.0.1'].includes(seedTarget.hostname) || seedTarget.pathname !== '/acao_social' || process.env.NODE_ENV === 'production') {
  throw new Error('Seed permitido somente no banco local acao_social fora de producao. Nenhum dado foi alterado.')
}
const seedPassword = getRequiredEnv('SEED_USER_PASSWORD')
if (seedPassword.length < 12 || Buffer.byteLength(seedPassword, 'utf8') > 72) {
  throw new Error('SEED_USER_PASSWORD deve ter pelo menos 12 caracteres e no maximo 72 bytes. Nenhum dado foi alterado.')
}

const pool = new Pool({
  connectionString,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes (se houver)
  await prisma.matricula.deleteMany({})
  await prisma.consulta.deleteMany({})
  await prisma.aula.deleteMany({})
  await prisma.beneficiario.deleteMany({})
  await prisma.instrutor.deleteMany({})
  await prisma.medico.deleteMany({})
  await prisma.user.deleteMany({})
  console.log('✓ Dados antigos removidos')

  // ===== CRIAR USUÁRIOS =====
  const password = bcrypt.hashSync(seedPassword, 12)

  const usersData = [
    // Médicos
    { name: 'Dr. Ana Silva', email: 'ana.silva@gmail.com', password },
    { name: 'Dr. Bruno Costa', email: 'bruno.costa@gmail.com', password },
    { name: 'Dra. Carla Santos', email: 'carla.santos@gmail.com', password },
    { name: 'Dr. Diego Ferreira', email: 'diego.ferreira@gmail.com', password },
    { name: 'Dra. Elisa Oliveira', email: 'elisa.oliveira@gmail.com', password },
    // Instrutores
    { name: 'Instrutora Fernanda Lima', email: 'fernanda.lima@gmail.com', password },
    { name: 'Instrutor Gabriel Rocha', email: 'gabriel.rocha@gmail.com', password },
    { name: 'Instrutora Helena Gomes', email: 'helena.gomes@gmail.com', password },
    { name: 'Instrutor Igor Mendes', email: 'igor.mendes@gmail.com', password },
    { name: 'Instrutora Julia Pereira', email: 'julia.pereira@gmail.com', password }
  ]

  const createdUsers = [] as any[]
  for (const u of usersData) {
    const created = await prisma.user.create({ data: u })
    createdUsers.push(created)
  }
  console.log(`✓ ${createdUsers.length} usuários criados`)

  // ===== CRIAR MÉDICOS =====
  const medicos = []
  for (let i = 0; i < 5; i++) {
    const medico = await prisma.medico.create({ data: { userId: createdUsers[i].id } })
    medicos.push(medico)
  }
  console.log(`✓ ${medicos.length} médicos criados`)

  // ===== CRIAR INSTRUTORES =====
  const instrutores = []
  for (let i = 5; i < 10; i++) {
    const instrutor = await prisma.instrutor.create({ data: { userId: createdUsers[i].id } })
    instrutores.push(instrutor)
  }
  console.log(`✓ ${instrutores.length} instrutores criados`)

  // ===== CRIAR BENEFICIÁRIOS (8 registros) =====
  const beneficiariosData = [
    { name: 'Maria Santos Silva', telefone: '11991112222' },
    { name: 'João Pereira Costa', telefone: '11991113333' },
    { name: 'Lucas Almeida Junior', telefone: '11991114444' },
    { name: 'Mariana Rocha Oliveira', telefone: '11991115555' },
    { name: 'Rafael Gomes Mendes', telefone: '11991116666' },
    { name: 'Camila Barbosa Dias', telefone: '11991117777' },
    { name: 'Felipe Martins Rodrigues', telefone: '11991118888' },
    { name: 'Bianca Fernandes Teixeira', telefone: '11991119999' }
  ]

  const beneficiarios = []
  for (const b of beneficiariosData) {
    const created = await prisma.beneficiario.create({ data: b })
    beneficiarios.push(created)
  }
  console.log(`✓ ${beneficiarios.length} beneficiários criados`)

  // ===== CRIAR AULAS (8 registros) =====
  const aulasData = [
    { titulo: 'Yoga para Iniciantes', modalidade: 'Yoga', vagas: 10, instrutorId: instrutores[0].id },
    { titulo: 'Yoga Avançado', modalidade: 'Yoga', vagas: 8, instrutorId: instrutores[0].id },
    { titulo: 'Pilates Funcional', modalidade: 'Pilates', vagas: 12, instrutorId: instrutores[1].id },
    { titulo: 'Pilates Reformer', modalidade: 'Pilates', vagas: 6, instrutorId: instrutores[1].id },
    { titulo: 'Dança de Salão', modalidade: 'Dança', vagas: 15, instrutorId: instrutores[2].id },
    { titulo: 'Dança Contemporânea', modalidade: 'Dança', vagas: 10, instrutorId: instrutores[2].id },
    { titulo: 'Musculação Adaptada', modalidade: 'Musculação', vagas: 12, instrutorId: instrutores[3].id },
    { titulo: 'Hidroginástica', modalidade: 'Hidroginástica', vagas: 20, instrutorId: instrutores[4].id }
  ]

  const aulas = []
  for (const a of aulasData) {
    const created = await prisma.aula.create({ data: a })
    aulas.push(created)
  }
  console.log(`✓ ${aulas.length} aulas criadas`)

  // ===== CRIAR CONSULTAS (8 registros) =====
  const now = new Date()
  const consultasData = [
    { medicoId: medicos[0].id, beneficiarioId: beneficiarios[0].id, dataHora: addDays(now, 1) },
    { medicoId: medicos[0].id, beneficiarioId: beneficiarios[1].id, dataHora: addDays(now, 2) },
    { medicoId: medicos[1].id, beneficiarioId: beneficiarios[2].id, dataHora: addDays(now, 3) },
    { medicoId: medicos[1].id, beneficiarioId: beneficiarios[3].id, dataHora: addDays(now, 4) },
    { medicoId: medicos[2].id, beneficiarioId: beneficiarios[4].id, dataHora: addDays(now, 5) },
    { medicoId: medicos[3].id, beneficiarioId: beneficiarios[5].id, dataHora: addDays(now, 6) },
    { medicoId: medicos[4].id, beneficiarioId: beneficiarios[6].id, dataHora: addDays(now, 7) },
    { medicoId: medicos[0].id, beneficiarioId: beneficiarios[7].id, dataHora: addDays(now, 8) }
  ]

  const consultas = []
  for (const c of consultasData) {
    const created = await prisma.consulta.create({ data: c })
    consultas.push(created)
  }
  console.log(`✓ ${consultas.length} consultas criadas`)

  // ===== CRIAR MATRÍCULAS (10 registros) =====
  const matriculasData = [
    { beneficiarioId: beneficiarios[0].id, aulaId: aulas[0].id },
    { beneficiarioId: beneficiarios[0].id, aulaId: aulas[2].id },
    { beneficiarioId: beneficiarios[1].id, aulaId: aulas[0].id },
    { beneficiarioId: beneficiarios[2].id, aulaId: aulas[1].id },
    { beneficiarioId: beneficiarios[2].id, aulaId: aulas[3].id },
    { beneficiarioId: beneficiarios[3].id, aulaId: aulas[4].id },
    { beneficiarioId: beneficiarios[4].id, aulaId: aulas[5].id },
    { beneficiarioId: beneficiarios[5].id, aulaId: aulas[6].id },
    { beneficiarioId: beneficiarios[6].id, aulaId: aulas[7].id },
    { beneficiarioId: beneficiarios[7].id, aulaId: aulas[4].id }
  ]

  const matriculas = []
  for (const m of matriculasData) {
    const created = await prisma.matricula.create({ data: m })
    matriculas.push(created)
  }
  console.log(`✓ ${matriculas.length} matrículas criadas`)

  console.log('\n🎉 Seed finalizado com sucesso!')
  console.log('📊 Resumo:')
  console.log(`   - Usuários: ${createdUsers.length}`)
  console.log(`   - Médicos: ${medicos.length}`)
  console.log(`   - Instrutores: ${instrutores.length}`)
  console.log(`   - Beneficiários: ${beneficiarios.length}`)
  console.log(`   - Aulas: ${aulas.length}`)
  console.log(`   - Consultas: ${consultas.length}`)
  console.log(`   - Matrículas: ${matriculas.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    // @ts-ignore
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
