import { z } from 'zod'

const dateString = z
  .string()
  .datetime({ offset: true })
  .or(z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Formato de data inválido'
  }))

export const createConsultaSchema = z.object({
  medicoId: z.string().uuid().optional(),
  beneficiarioId: z.string().uuid(),
  dataHora: dateString
})

export const updateConsultaSchema = z.object({
  dataHora: dateString
})
