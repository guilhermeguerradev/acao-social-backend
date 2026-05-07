import { z } from 'zod'

export const createInstrutorSchema = z.object({
  userId: z.string().uuid()
})

export const updateInstrutorSchema = z.object({
  userId: z.string().uuid()
})
