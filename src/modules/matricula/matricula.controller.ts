import { Request, Response, NextFunction } from 'express'
import { MatriculaService } from './matricula.service'

const service = new MatriculaService()

export class MatriculaController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.create(req.body)
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
      const result = await service.update(req.params.id as string, req.body)
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
