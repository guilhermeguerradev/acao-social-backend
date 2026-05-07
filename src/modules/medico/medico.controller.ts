import { Request, Response, NextFunction } from 'express'
import { MedicoService } from './medico.service'

const service = new MedicoService()

export class MedicoController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.create(req.body.userId)
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findAll()
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
      const result = await service.update(req.params.id as string, req.body.userId)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id as string)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
