import { parseListQuery, paginated } from '../../utils/listQuery'
import { prisma } from '../../config/prisma'
import { Prisma } from '@prisma/client'
import { AppError } from '../../utils/AppError'
import { beneficiarioSelect } from '../../utils/prismaSelect'

export class BeneficiarioService {
  async create(data: { name: string; telefone?: string; isAluno: boolean; curso?: 'BOMBEIRO_MIRIM' | null }) {
    return prisma.beneficiario.create({
      data,
      select: beneficiarioSelect,
    })
  }

  async findAll(input: unknown = {}) {
    const query = parseListQuery('beneficiario', input)
    const { page, limit } = query
    const where = query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}

    const [data, total] = await prisma.$transaction([
      prisma.beneficiario.findMany({ where, select: beneficiarioSelect, orderBy: [{ createdAt: 'desc' as const }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
      prisma.beneficiario.count({ where }),
    ])
    return paginated(data, total, page, limit)
  }

  async findById(id: string) {
    const beneficiario = await prisma.beneficiario.findUnique({
      where: { id },
      select: beneficiarioSelect,
    })

    if (!beneficiario) {
      throw new AppError('Beneficiario nao encontrado', 404)
    }

    return beneficiario
  }

  async update(id: string, data: { name?: string; telefone?: string; isAluno?: boolean; curso?: 'BOMBEIRO_MIRIM' | null }) {
    await this.findById(id)
    return prisma.beneficiario.update({
      where: { id },
      data: { name: data.name, telefone: data.telefone, isAluno: data.isAluno, curso: data.isAluno ? data.curso : null },
      select: beneficiarioSelect,
    })
  }

  async delete(id: string) {
    await this.findById(id)
    try {
      await prisma.beneficiario.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') throw new AppError('Beneficiario possui dependencias e nao pode ser removido', 409)
        if (error.code === 'P2025') throw new AppError('Beneficiario nao encontrado', 404)
      }
      throw error
    }
  }
}
