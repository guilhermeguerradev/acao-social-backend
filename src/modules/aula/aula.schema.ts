import { z } from 'zod'

export const createAulaSchema = z.object({
  titulo: z.string().trim().min(1),
  modalidade: z.string().trim().min(1),
  vagas: z.number().int().positive(),
  instrutorId: z.string().uuid().optional()
})

export const updateAulaSchema = z.object({
  titulo: z.string().trim().min(1).optional(),
  modalidade: z.string().trim().min(1).optional(),
  vagas: z.number().int().positive().optional(),
  instrutorId: z.string().uuid().optional()
})
