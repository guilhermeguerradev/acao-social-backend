import bcrypt from 'bcryptjs'
import { prisma } from '../../config/prisma'
import { generateToken } from '../../utils/jwt'
import { AppError } from '../../utils/AppError'
import { publicUserSelect } from '../../utils/prismaSelect'

type RegisterInput = {
  name: string
  email: string
  password: string
}

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        isAdmin: true,
        id: true,
        name: true,
        email: true,
        password: true,
        medico: { select: { id: true } },
        instrutor: { select: { id: true } },
      },
    })

    if (!user) {
      throw new AppError('Credenciais invalidas', 401)
    }

    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      throw new AppError('Credenciais invalidas', 401)
    }

    const role = user.isAdmin ? 'ADMIN' : user.medico ? 'MEDICO' : user.instrutor ? 'INSTRUTOR' : null

    const token = generateToken({
      userId: user.id,
      role,
    })

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
      },
    }
  }

  async registerMedico(data: RegisterInput) {
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
        password: hash,
        medico: {
          create: {},
        },
      },
      select: {
        ...publicUserSelect,
        medico: { select: { id: true } }
      }
    })
  }

  async registerInstrutor(data: RegisterInput) {
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
        password: hash,
        instrutor: {
          create: {},
        },
      },
      select: {
        ...publicUserSelect,
        instrutor: { select: { id: true } }
      }
    })
  }
}
