import { z } from 'zod'

export const promoteAdminSchema = z.object({}).strict()
export const userIdSchema = z.string().uuid()

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72)
}).strict()

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(8).max(72).optional()
}).strict()
