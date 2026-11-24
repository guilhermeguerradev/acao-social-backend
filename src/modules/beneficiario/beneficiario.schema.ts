import { z } from 'zod'

export const createBeneficiarioSchema = z.object({
  name: z.string().trim().min(1).max(120),
  telefone: z.string().trim().max(20).optional(),
  isAluno: z.boolean().default(false),
  curso: z.enum(['BOMBEIRO_MIRIM']).nullable().optional()
})

export const updateBeneficiarioSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  telefone: z.string().trim().max(20).optional(),
  isAluno: z.boolean().optional(),
  curso: z.enum(['BOMBEIRO_MIRIM']).nullable().optional()
}).strict().refine(data => Object.keys(data).length > 0, { message: "Informe nome ou telefone" })
