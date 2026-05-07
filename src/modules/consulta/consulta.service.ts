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

  async findAll() {
    return prisma.consulta.findMany({
      select: consultaSelect,
      orderBy: { dataHora: 'asc' },
      take: 100,
    })
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

  async update(id: string, dataHora: Date, requesterMedicoId?: string) {
    const consulta = await prisma.consulta.findUnique({
      where: { id },
      select: { id: true, medicoId: true },
    })

    if (!consulta) {
      throw new AppError('Consulta nao encontrada', 404)
    }

    if (requesterMedicoId && consulta.medicoId !== requesterMedicoId) {
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

    return prisma.consulta.update({
      where: { id },
      data: { dataHora: parsedDate },
      select: consultaSelect,
    })
  }

  async delete(id: string, requesterMedicoId?: string) {
    const consulta = await prisma.consulta.findUnique({
      where: { id },
      select: { medicoId: true },
    })

    if (!consulta) {
      throw new AppError('Consulta nao encontrada', 404)
    }

    if (requesterMedicoId && consulta.medicoId !== requesterMedicoId) {
      throw new AppError('Acesso negado', 403)
    }

    await prisma.consulta.delete({
      where: { id }
    })
  }
}
