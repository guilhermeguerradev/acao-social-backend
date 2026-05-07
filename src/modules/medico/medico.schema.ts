import { z } from 'zod'

export const createMedicoSchema = z.object({
  userId: z.string().uuid()
})

export const updateMedicoSchema = z.object({
  userId: z.string().uuid()
})
