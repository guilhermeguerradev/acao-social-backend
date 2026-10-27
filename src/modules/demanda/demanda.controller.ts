import { Request, Response } from 'express'
import { AppError } from '../../utils/AppError'
import { DemandActor, DemandService } from './demanda.service'
import { demandIdSchema } from './demanda.schema'

const service = new DemandService()

function getActor(req: Request): DemandActor {
  if (!req.user?.userId) throw new AppError('Nao autorizado', 401)
  return { userId: req.user.userId, role: req.user.role ?? null }
}

export class DemandController {
  async create(req: Request, res: Response) {
    const result = await service.create(req.body, getActor(req))
    return res.status(result.created ? 201 : 200).json(result.demand)
  }

  async findAll(req: Request, res: Response) {
    return res.json(await service.findAll(req.query, getActor(req)))
  }

  async findById(req: Request, res: Response) {
    const id = demandIdSchema.safeParse(req.params.id)
    if (!id.success) throw new AppError('Identificador de demanda invalido', 400)
    return res.json(await service.findById(id.data, getActor(req)))
  }
}
