import { Prisma } from '@prisma/client'
import { parseListQuery, paginated } from '../../utils/listQuery'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { instrutorWithUserSelect } from '../../utils/prismaSelect'

const aulaSelect = {
  id: true,
  titulo: true,
  modalidade: true,
  vagas: true,
  instrutorId: true,
  createdAt: true,
  instrutor: { select: instrutorWithUserSelect },
  _count: { select: { matriculas: true } },
} as const

export class AulaService {
  async create(data: {
    titulo: string
    modalidade: string
    vagas: number
    instrutorId: string
  }) {
    if (!data.instrutorId) throw new AppError('Selecione o instrutor responsavel', 400)
    const instrutor = await prisma.instrutor.findUnique({
      where: { id: data.instrutorId }
    })

    if (!instrutor) {
      throw new AppError('Instrutor nao encontrado', 404)
    }

    return prisma.aula.create({
      data,
      select: aulaSelect,
    })
  }

  async findAll(input: unknown = {}) {
    const query = parseListQuery('aula', input)
    const { page, limit } = query
    const where: Prisma.AulaWhereInput = { instrutorId: query.instrutorId, modalidade: query.modalidade ? { contains: query.modalidade, mode: 'insensitive' as const } : undefined }

    if (query.available !== undefined) {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT a."id" FROM "Aula" a
        WHERE (a."vagas" > (SELECT COUNT(*) FROM "Matricula" m WHERE m."aulaId" = a."id")) = ${query.available === 'true'}
      `
      where.id = { in: rows.map(row => row.id) }
    }
    const [data, total] = await prisma.$transaction([
      prisma.aula.findMany({ where, select: aulaSelect, orderBy: [{ createdAt: 'desc' as const }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
      prisma.aula.count({ where }),
    ])
    return paginated(data, total, page, limit)
  }

  async findById(id: string) {
    const aula = await prisma.aula.findUnique({
      where: { id },
      select: aulaSelect,
    })

    if (!aula) {
      throw new AppError('Aula nao encontrada', 404)
    }

    return aula
  }

  async update(id: string, data: {
    titulo?: string
    modalidade?: string
    vagas?: number
    instrutorId?: string
  }, requesterInstrutorId?: string, isAdmin = false) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const aula = await tx.aula.findUnique({
        where: { id },
        select: {
          id: true,
          instrutorId: true,
          _count: { select: { matriculas: true } },
        }
      })

      if (!aula) {
        throw new AppError('Aula nao encontrada', 404)
      }

      if (!isAdmin && (!requesterInstrutorId || aula.instrutorId !== requesterInstrutorId)) {
        throw new AppError('Acesso negado', 403)
      }

      if (data.instrutorId && data.instrutorId !== aula.instrutorId) {
        throw new AppError('Nao e permitido transferir aula entre instrutores', 403)
      }

      if (data.vagas !== undefined && data.vagas < aula._count.matriculas) {
        throw new AppError('Vagas nao podem ser menores que numero de matriculados', 400)
      }

      return tx.aula.update({
        where: { id },
        data: {
          titulo: data.titulo,
          modalidade: data.modalidade,
          vagas: data.vagas,
        },
        select: aulaSelect,
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }

  async delete(id: string, requesterInstrutorId?: string, isAdmin = false) {
    const aula = await prisma.aula.findUnique({
      where: { id },
      select: { instrutorId: true },
    })

    if (!aula) {
      throw new AppError('Aula nao encontrada', 404)
    }

    if (!isAdmin && (!requesterInstrutorId || aula.instrutorId !== requesterInstrutorId)) {
      throw new AppError('Acesso negado', 403)
    }

    try {
      await prisma.aula.delete({
        where: { id }
      })
    } catch {
      throw new AppError('Aula possui dependencias e nao pode ser removida', 409)
    }
  }
}
