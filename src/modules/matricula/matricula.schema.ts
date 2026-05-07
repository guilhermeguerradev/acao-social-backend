import { z } from 'zod'

export const createMatriculaSchema = z.object({
  beneficiarioId: z.string().uuid(),
  aulaId: z.string().uuid()
})

export const updateMatriculaSchema = z.object({
  beneficiarioId: z.string().uuid().optional(),
  aulaId: z.string().uuid().optional()
})