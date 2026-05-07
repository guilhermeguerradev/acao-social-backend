import { Request, Response, NextFunction } from 'express'
import { AuthService } from './auth.service'
import { AppError } from '../../utils/AppError'

const service = new AuthService()

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body as { email?: string; password?: string }

      if (!email || !password) {
        throw new AppError('Email e password sao obrigatorios', 400)
      }

      const result = await service.login(email, password)
      return res.json(result)
    } catch (error) {
      next(error)
    }
  }

  async registerMedico(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.registerMedico(req.body)
      return res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }

  async registerInstrutor(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.registerInstrutor(req.body)
      return res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }
}
