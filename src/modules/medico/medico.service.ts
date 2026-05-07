import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { medicoWithUserSelect } from '../../utils/prismaSelect'

export class MedicoService {
  async create(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        medico: { select: { id: true } },
      }
    })

    if (!user) {
      throw new AppError('Usuario nao encontrado', 404)
    }

    if (user.medico) {
      throw new AppError('Usuario ja e medico', 400)
    }

    return prisma.medico.create({
      data: { userId },
      select: medicoWithUserSelect,
    })
  }

  async findAll() {
    return prisma.medico.findMany({
      select: medicoWithUserSelect,
      take: 100,
    })
  }

  async findById(id: string) {
    const medico = await prisma.medico.findUnique({
      where: { id },
      select: medicoWithUserSelect,
    })

    if (!medico) {
      throw new AppError('Medico nao encontrado', 404)
    }

    return medico
  }

  async update(id: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        medico: { select: { id: true } },
      }
    })

    if (!user) {
      throw new AppError('Usuario nao encontrado', 404)
    }

    if (user.medico && user.medico.id !== id) {
      throw new AppError('Usuario ja e medico', 400)
    }

    return prisma.medico.update({
      where: { id },
      data: { userId },
      select: medicoWithUserSelect,
    })
  }

  async delete(id: string) {
    try {
      await prisma.medico.delete({
        where: { id }
      })
    } catch {
      throw new AppError('Medico nao encontrado', 404)
    }
  }
}
