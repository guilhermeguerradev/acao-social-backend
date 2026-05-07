import { Request, Response, NextFunction } from 'express'
import { ZodError, ZodSchema } from 'zod'

export function validate(schema: ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: err.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        })
      }

      return res.status(400).json({
        error: 'Dados invalidos'
      })
    }
  }
}
