import { prisma } from '../../config/prisma'
import bcrypt from 'bcryptjs'
import { AppError } from '../../utils/AppError'
import { publicUserSelect } from '../../utils/prismaSelect'

export class UserService {
  async create(data: {
    name: string
    email: string
    password: string
  }) {
    const exists = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (exists) {
      throw new AppError('Email ja cadastrado', 400)
    }

    const hash = await bcrypt.hash(data.password, 12)

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash
      },
      select: {
        ...publicUserSelect,
        medico: { select: { id: true } },
        instrutor: { select: { id: true } }
      }
    })
  }

  async findAll() {
    return prisma.user.findMany({
      select: {
        ...publicUserSelect,
        medico: { select: { id: true } },
        instrutor: { select: { id: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...publicUserSelect,
        medico: { select: { id: true } },
        instrutor: { select: { id: true } }
      }
    })

    if (!user) {
      throw new AppError('Usuario nao encontrado', 404)
    }

    return user
  }

  async update(id: string, data: {
    name?: string
    email?: string
    password?: string
  }) {
    if (data.email) {
      const exists = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (exists && exists.id !== id) {
        throw new AppError('Email ja cadastrado', 400)
      }
    }

    const updateData: {
      name?: string
      email?: string
      password?: string
    } = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.password) updateData.password = await bcrypt.hash(data.password, 12)

    try {
      return prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          ...publicUserSelect,
          medico: { select: { id: true } },
          instrutor: { select: { id: true } }
        }
      })
    } catch {
      throw new AppError('Usuario nao encontrado', 404)
    }
  }

  async delete(id: string) {
    try {
      await prisma.user.delete({
        where: { id }
      })
    } catch {
      throw new AppError('Usuario nao encontrado', 404)
    }
  }
}
