import { Request, Response, NextFunction } from 'express'
import { AulaService } from './aula.service'

const service = new AulaService()

export class AulaController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.create({
        ...req.body,
        instrutorId: req.user?.role === 'ADMIN' ? req.body.instrutorId : req.user?.instrutorId,
      })
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findAll(req.query)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findById(req.params.id as string)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.update(req.params.id as string, req.body, req.user?.instrutorId, req.user?.role === 'ADMIN')
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id as string, req.user?.instrutorId, req.user?.role === 'ADMIN')
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
