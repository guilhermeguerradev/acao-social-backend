import { prisma } from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { instrutorWithUserSelect } from '../../utils/prismaSelect'

export class InstrutorService {
  async create(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        instrutor: { select: { id: true } },
      }
    })

    if (!user) {
      throw new AppError('Usuario nao encontrado', 404)
    }

    if (user.instrutor) {
      throw new AppError('Usuario ja e instrutor', 400)
    }

    return prisma.instrutor.create({
      data: { userId },
      select: instrutorWithUserSelect,
    })
  }

  async findAll() {
    return prisma.instrutor.findMany({
      select: instrutorWithUserSelect,
      take: 100,
    })
  }

  async findById(id: string) {
    const instrutor = await prisma.instrutor.findUnique({
      where: { id },
      select: instrutorWithUserSelect,
    })

    if (!instrutor) {
      throw new AppError('Instrutor nao encontrado', 404)
    }

    return instrutor
  }

  async update(id: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        instrutor: { select: { id: true } },
      }
    })

    if (!user) {
      throw new AppError('Usuario nao encontrado', 404)
    }

    if (user.instrutor && user.instrutor.id !== id) {
      throw new AppError('Usuario ja e instrutor', 400)
    }

    return prisma.instrutor.update({
      where: { id },
      data: { userId },
      select: instrutorWithUserSelect,
    })
  }

  async delete(id: string) {
    try {
      await prisma.instrutor.delete({
        where: { id }
      })
    } catch {
      throw new AppError('Instrutor nao encontrado', 404)
    }
  }
}
