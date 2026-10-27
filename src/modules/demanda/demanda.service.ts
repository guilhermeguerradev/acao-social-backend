import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { paginated, parseListQuery } from '../../utils/listQuery'
import { createDemandSchema } from './demanda.schema'
import { demandConsent } from './demanda.options'

export type DemandActor = { userId: string; role: string | null }

const demandSelect = {
  id: true,
  description: true,
  status: true,
  requesterId: true,
  createdAt: true,
  requester: { select: { id: true, name: true } },
  phone: true,
  neighborhood: true,
  returnPreference: true,
  category: true,
  otherDescription: true,
  urgent: true,
  contactConsentAt: true,
  contactConsentVersion: true,
  contactConsentText: true,
} as const

function accessScope(actor: DemandActor): Prisma.DemandWhereInput {
  if (!actor.userId) throw new AppError('Nao autorizado', 401)
  return actor.role === 'ADMIN' || actor.role === 'MEDICO' || actor.role === 'INSTRUTOR'
    ? {}
    : { requesterId: actor.userId }
}

export class DemandService {
  async create(input: unknown, actor: DemandActor) {
    if (!actor.userId) throw new AppError('Nao autorizado', 401)
    const parsed = createDemandSchema.safeParse(input)
    if (!parsed.success) throw new AppError(parsed.error.issues.map(issue => issue.message).join(', '), 400)
    const data = parsed.data
    const content = {
      description: data.description,
      phone: data.phone,
      neighborhood: data.neighborhood,
      returnPreference: data.returnPreference,
      category: data.category,
      otherDescription: data.otherDescription,
      urgent: data.urgent,
    }
    const sameContent = (record: Prisma.DemandGetPayload<{ select: typeof demandSelect }>) =>
      Object.entries(content).every(([field, value]) => record[field as keyof typeof content] === value)
    const where = { requesterId_requestKey: { requesterId: actor.userId, requestKey: data.requestKey } }
    const previous = await prisma.demand.findUnique({ where, select: demandSelect })
    if (previous) {
      if (!sameContent(previous)) throw new AppError('Este envio ja foi recebido com outro conteudo. Confira as demandas recebidas antes de iniciar outra solicitacao.', 409)
      return { demand: previous, created: false }
    }

    try {
      const demand = await prisma.demand.create({
        data: {
          ...content,
          requestKey: data.requestKey,
          requesterId: actor.userId,
          contactConsentAt: new Date(),
          contactConsentVersion: demandConsent.version,
          contactConsentText: demandConsent.text,
        },
        select: demandSelect,
      })
      return { demand, created: true }
    } catch (error) {
      // Two concurrent retries are arbitrated by the database unique constraint.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await prisma.demand.findUnique({ where, select: demandSelect })
        if (existing && sameContent(existing)) return { demand: existing, created: false }
        throw new AppError('Este envio ja foi recebido com outro conteudo. Confira as demandas recebidas antes de iniciar outra solicitacao.', 409)
      }
      throw error
    }
  }

  async findAll(input: unknown, actor: DemandActor) {
    const { page, limit, search } = parseListQuery('demanda', input)
    const where: Prisma.DemandWhereInput = {
      ...accessScope(actor),
      ...(search ? { OR: [
        { id: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { requester: { name: { contains: search, mode: 'insensitive' as const } } },
      ] } : {}),
    }
    const [data, total] = await prisma.$transaction([
      prisma.demand.findMany({
        where,
        select: demandSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.demand.count({ where }),
    ])
    return paginated(data, total, page, limit)
  }

  async findById(id: string, actor: DemandActor) {
    const demand = await prisma.demand.findFirst({
      where: { ...accessScope(actor), id },
      select: demandSelect,
    })
    // Do not disclose whether a demand belonging to someone else exists.
    if (!demand) throw new AppError('Demanda nao encontrada', 404)
    return demand
  }
}
