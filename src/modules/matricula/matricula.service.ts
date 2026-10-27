import { parseListQuery, paginated } from '../../utils/listQuery'
import { Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { beneficiarioSelect } from '../../utils/prismaSelect'

const matriculaSelect = {
  id: true,
  beneficiarioId: true,
  aulaId: true,
  createdAt: true,
  beneficiario: { select: beneficiarioSelect },
  aula: {
    select: {
      id: true,
      titulo: true,
      modalidade: true,
      vagas: true,
      instrutorId: true,
      createdAt: true,
    },
  },
} as const

export class MatriculaService {
  async create(data: {
    beneficiarioId: string
    aulaId: string
  }) {
    try {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const [aula, beneficiario] = await Promise.all([
          tx.aula.findUnique({
            where: { id: data.aulaId },
            select: {
              id: true,
              vagas: true,
              _count: { select: { matriculas: true } },
            }
          }),
          tx.beneficiario.findUnique({
            where: { id: data.beneficiarioId },
            select: { id: true },
          })
        ])

        if (!aula) {
          throw new AppError('Aula nao encontrada', 404)
        }

        if (!beneficiario) {
          throw new AppError('Beneficiario nao encontrado', 404)
        }

        if (aula._count.matriculas >= aula.vagas) {
          throw new AppError('Limite de vagas atingido', 400)
        }

        return tx.matricula.create({
          data,
          select: matriculaSelect,
        })
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (err) {
      if (err instanceof AppError) throw err
      throw new AppError('Beneficiario ja matriculado ou limite de vagas atingido', 409)
    }
  }

  async findAll(input: unknown = {}) {
    const query = parseListQuery('matricula', input)
    const { page, limit } = query
    const where = { aulaId: query.aulaId }

    const [data, total] = await prisma.$transaction([
      prisma.matricula.findMany({ where, select: matriculaSelect, orderBy: [{ createdAt: 'desc' as const }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
      prisma.matricula.count({ where }),
    ])
    return paginated(data, total, page, limit)
  }

  async findById(id: string) {
    const matricula = await prisma.matricula.findUnique({
      where: { id },
      select: matriculaSelect,
    })

    if (!matricula) {
      throw new AppError('Matricula nao encontrada', 404)
    }

    return matricula
  }

  async update(id: string, data: {
    beneficiarioId?: string
    aulaId?: string
  }) {
    try {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const current = await tx.matricula.findUnique({
          where: { id },
          select: { id: true, aulaId: true, beneficiarioId: true },
        })

        if (!current) {
          throw new AppError('Matricula nao encontrada', 404)
        }

        const nextAulaId = data.aulaId ?? current.aulaId
        const nextBeneficiarioId = data.beneficiarioId ?? current.beneficiarioId

        const [aula, beneficiario] = await Promise.all([
          tx.aula.findUnique({
            where: { id: nextAulaId },
            select: {
              id: true,
              vagas: true,
              _count: { select: { matriculas: true } },
            },
          }),
          tx.beneficiario.findUnique({
            where: { id: nextBeneficiarioId },
            select: { id: true },
          }),
        ])

        if (!aula) throw new AppError('Aula nao encontrada', 404)
        if (!beneficiario) throw new AppError('Beneficiario nao encontrado', 404)

        if (nextAulaId !== current.aulaId && aula._count.matriculas >= aula.vagas) {
          throw new AppError('Limite de vagas atingido', 400)
        }

        return tx.matricula.update({
          where: { id },
          data,
          select: matriculaSelect,
        })
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (err) {
      if (err instanceof AppError) throw err
      throw new AppError('Matricula duplicada ou invalida', 409)
    }
  }

  async delete(id: string) {
    try {
      await prisma.matricula.delete({
        where: { id }
      })
    } catch {
      throw new AppError('Matricula nao encontrada', 404)
    }
  }
}
