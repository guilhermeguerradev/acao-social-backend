import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6)
})

export const registerMedicoSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72)
})

export const registerInstrutorSchema = registerMedicoSchema
