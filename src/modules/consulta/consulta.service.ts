import { parseListQuery, paginated } from '../../utils/listQuery'
import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { beneficiarioSelect, medicoWithUserSelect } from '../../utils/prismaSelect'

const consultaSelect = {
  id: true,
  dataHora: true,
  medicoId: true,
  beneficiarioId: true,
  createdAt: true,
  medico: { select: medicoWithUserSelect },
  beneficiario: { select: beneficiarioSelect },
} as const

function parseDate(date: Date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new AppError('Data invalida', 400)
  }

  return date
}

export class ConsultaService {

  async create(data: {
    medicoId: string
    beneficiarioId: string
    dataHora: Date
  }) {
    const dataHora = parseDate(data.dataHora)
    if (!data.medicoId) throw new AppError('Selecione o medico responsavel', 400)

    const [medico, beneficiario] = await Promise.all([
      prisma.medico.findUnique({ where: { id: data.medicoId } }),
      prisma.beneficiario.findUnique({ where: { id: data.beneficiarioId } })
    ])

    if (!medico) throw new AppError('Medico nao encontrado', 404)

    if (!beneficiario) throw new AppError('Beneficiario nao encontrado', 404)

    if (dataHora < new Date()) {
      throw new AppError('Nao e possivel agendar consulta no passado', 400)
    }

    const conflito = await prisma.consulta.findFirst({
      where: {
        medicoId: data.medicoId,
        dataHora
      },
      select: { id: true },
    })

    if (conflito) {
      throw new AppError('Horario indisponivel', 409)
    }

    return prisma.consulta.create({
      data: {
        medicoId: data.medicoId,
        beneficiarioId: data.beneficiarioId,
        dataHora
      },
      select: consultaSelect,
    })
  }

  async findAll(input: unknown = {}) {
    const query = parseListQuery('consulta', input)
    const { page, limit } = query
    const where = { medicoId: query.medicoId, beneficiarioId: query.beneficiarioId, dataHora: { gte: query.startDate ? new Date(query.startDate) : undefined, lte: query.endDate ? new Date(query.endDate) : undefined } }

    const [data, total] = await prisma.$transaction([
      prisma.consulta.findMany({ where, select: consultaSelect, orderBy: [{ dataHora: 'asc' as const }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
      prisma.consulta.count({ where }),
    ])
    return paginated(data, total, page, limit)
  }

  async findById(id: string) {
    const consulta = await prisma.consulta.findUnique({
      where: { id },
      select: consultaSelect,
    })

    if (!consulta) {
      throw new AppError('Consulta nao encontrada', 404)
    }

    return consulta
  }

  async update(id: string, dataHora: Date, requesterMedicoId?: string, isAdmin = false) {
    const consulta = await prisma.consulta.findUnique({
      where: { id },
      select: { id: true, medicoId: true },
    })

    if (!consulta) {
      throw new AppError('Consulta nao encontrada', 404)
    }

    if (!isAdmin && (!requesterMedicoId || consulta.medicoId !== requesterMedicoId)) {
      throw new AppError('Acesso negado', 403)
    }

    const parsedDate = parseDate(dataHora)

    if (parsedDate < new Date()) {
      throw new AppError('Nao e possivel agendar consulta no passado', 400)
    }

    const conflito = await prisma.consulta.findFirst({
      where: {
        medicoId: consulta.medicoId,
        dataHora: parsedDate,
        NOT: { id }
      },
      select: { id: true },
    })

    if (conflito) {
      throw new AppError('Horario indisponivel', 409)
    }

    try {
      return await prisma.consulta.update({
      where: { id },
      data: { dataHora: parsedDate },
      select: consultaSelect,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new AppError('Horario indisponivel', 409)
      throw error
    }
  }

  async delete(id: string, requesterMedicoId?: string, isAdmin = false) {
    const consulta = await prisma.consulta.findUnique({
      where: { id },
      select: { medicoId: true },
    })

    if (!consulta) {
      throw new AppError('Consulta nao encontrada', 404)
    }

    if (!isAdmin && (!requesterMedicoId || consulta.medicoId !== requesterMedicoId)) {
      throw new AppError('Acesso negado', 403)
    }

    await prisma.consulta.delete({
      where: { id }
    })
  }
}
