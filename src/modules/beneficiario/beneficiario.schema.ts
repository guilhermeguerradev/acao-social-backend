import { z } from 'zod'

export const createBeneficiarioSchema = z.object({
  name: z.string().trim().min(1).max(120),
  telefone: z.string().trim().max(20).optional()
})

export const updateBeneficiarioSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  telefone: z.string().trim().max(20).optional()
})
