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

  async findAll() {
    return prisma.aula.findMany({
      select: aulaSelect,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
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
  }, requesterInstrutorId?: string) {
    const aula = await prisma.aula.findUnique({
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

    if (requesterInstrutorId && aula.instrutorId !== requesterInstrutorId) {
      throw new AppError('Acesso negado', 403)
    }

    if (data.instrutorId && data.instrutorId !== aula.instrutorId) {
      throw new AppError('Nao e permitido transferir aula entre instrutores', 403)
    }

    if (data.vagas !== undefined && data.vagas < aula._count.matriculas) {
      throw new AppError('Vagas nao podem ser menores que numero de matriculados', 400)
    }

    return prisma.aula.update({
      where: { id },
      data: {
        titulo: data.titulo,
        modalidade: data.modalidade,
        vagas: data.vagas,
      },
      select: aulaSelect,
    })
  }

  async delete(id: string, requesterInstrutorId?: string) {
    const aula = await prisma.aula.findUnique({
      where: { id },
      select: { instrutorId: true },
    })

    if (!aula) {
      throw new AppError('Aula nao encontrada', 404)
    }

    if (requesterInstrutorId && aula.instrutorId !== requesterInstrutorId) {
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
