import { Request, Response, NextFunction } from 'express'
import { ConsultaService } from './consulta.service'

const service = new ConsultaService()

export class ConsultaController {

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.create({
        ...req.body,
        medicoId: req.user?.medicoId ?? req.body.medicoId,
        dataHora: new Date(req.body.dataHora)
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
      const result = await service.update(req.params.id as string, new Date(req.body.dataHora), req.user?.medicoId)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id as string, req.user?.medicoId)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
