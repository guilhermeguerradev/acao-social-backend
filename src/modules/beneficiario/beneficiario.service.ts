import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { beneficiarioSelect } from '../../utils/prismaSelect'

export class BeneficiarioService {
  async create(data: { name: string; telefone?: string }) {
    return prisma.beneficiario.create({
      data,
      select: beneficiarioSelect,
    })
  }

  async findAll() {
    return prisma.beneficiario.findMany({
      select: beneficiarioSelect,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
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

  async delete(id: string) {
    try {
      await prisma.beneficiario.delete({
        where: { id },
      })
    } catch {
      throw new AppError('Beneficiario nao encontrado', 404)
    }
  }
}
