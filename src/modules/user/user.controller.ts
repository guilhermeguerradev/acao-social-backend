import { Request, Response, NextFunction } from 'express'
import { UserService } from './user.service'
import { userIdSchema } from './user.schema'
import { AppError } from '../../utils/AppError'

const service = new UserService()

export class UserController {
  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) throw new AppError('Nao autorizado', 401)
      res.json(await service.update(req.user.userId, req.body, req.user))
    } catch (err) { next(err) }
  }

  async promoteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const id = userIdSchema.safeParse(req.params.id)
      if (!id.success) throw new AppError('Identificador de usuario invalido', 400)
      res.json(await service.promoteAdmin(id.data, req.user))
    } catch (err) { next(err) }
  }

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
      const result = await service.update(req.params.id as string, req.body, req.user)
      res.json(result)
    } catch (err) {
      next(err)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id as string, req.user)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}
