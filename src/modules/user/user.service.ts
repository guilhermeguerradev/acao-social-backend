import { prisma } from '../../config/prisma'
import { Prisma } from '@prisma/client'
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
  }, actor?: { userId?: string; role?: string | null }) {
    const target = await this.findById(id)
    if (target.isAdmin && actor?.role !== 'ADMIN') throw new AppError('Apenas administradores podem alterar esta conta', 403)
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
      return await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          ...publicUserSelect,
          medico: { select: { id: true } },
          instrutor: { select: { id: true } }
        }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') throw new AppError('Usuario nao encontrado', 404)
        if (error.code === 'P2002') throw new AppError('Email ja cadastrado', 409)
      }
      throw error
    }
  }

  async delete(id: string, actor?: { userId?: string; role?: string | null }) {
    const target = await this.findById(id)
    if (actor?.userId === id) throw new AppError('Nao e permitido excluir sua propria conta', 409)
    if (target.isAdmin && actor?.role !== 'ADMIN') throw new AppError('Apenas administradores podem remover esta conta', 403)
    try {
      await prisma.$transaction(async tx => {
        // Remove only empty professional profiles; FK restrictions preserve clinical,
        // course and demand history and roll back the entire deletion on conflict.
        await tx.medico.deleteMany({ where: { userId: id } })
        await tx.instrutor.deleteMany({ where: { userId: id } })
        await tx.user.delete({ where: { id } })
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') throw new AppError('Usuario possui dependencias e nao pode ser removido', 409)
        if (error.code === 'P2025') throw new AppError('Usuario nao encontrado', 404)
      }
      throw error
    }
  }
}
