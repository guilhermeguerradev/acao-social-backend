import { z } from 'zod'
import { demandCategories, demandReturnPreferences } from './demanda.options'

const phoneSchema = z.string().trim()
  .regex(/^\+?[\d\s().-]+$/, 'Informe um telefone brasileiro com DDD')
  .transform(value => {
    const digits = value.replace(/\D/g, '')
    return (digits.length === 12 || digits.length === 13) && digits.startsWith('55') ? digits.slice(2) : digits
  })
  .refine(value => /^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(value), 'Informe um telefone brasileiro válido com DDD')

export const createDemandSchema = z.object({
  description: z.string().trim().min(1).max(2000),
  requestKey: z.string().uuid(),
  phone: phoneSchema,
  neighborhood: z.string().trim().min(1).max(120),
  returnPreference: z.enum(demandReturnPreferences.map(option => option.value)),
  category: z.enum(demandCategories.map(option => option.value)),
  otherDescription: z.string().trim().max(200).nullish(),
  urgent: z.boolean(),
  contactConsent: z.literal(true, { error: 'É necessário autorizar o contato para enviar a solicitação' }),
}).strict().superRefine((data, context) => {
  if (data.category === 'OTHER' && !data.otherDescription) {
    context.addIssue({ code: 'custom', path: ['otherDescription'], message: 'Especifique o pedido ao selecionar Outros' })
  }
}).transform(data => ({ ...data, otherDescription: data.category === 'OTHER' ? data.otherDescription! : null }))

export type CreateDemandInput = z.output<typeof createDemandSchema>

export const demandIdSchema = z.string().uuid()
