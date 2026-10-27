import { z } from 'zod'
import { AppError } from './AppError'

const pagination = {
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}
const uuid = z.string().uuid().optional()
const date = z.string().datetime({ offset: true }).optional()
export const listSchemas = {
  beneficiario: z.object({ ...pagination, search: z.string().trim().max(120).optional() }),
  consulta: z.object({ ...pagination, medicoId: uuid, beneficiarioId: uuid, startDate: date, endDate: date })
    .refine(q => !q.startDate || !q.endDate || new Date(q.startDate) <= new Date(q.endDate), { message: 'Intervalo de datas invalido' }),
  aula: z.object({ ...pagination, instrutorId: uuid, modalidade: z.string().trim().max(120).optional(), available: z.enum(['true', 'false']).optional() }),
  matricula: z.object({ ...pagination, aulaId: uuid }),
  demanda: z.object({ ...pagination, search: z.string().trim().max(120).optional() }).strict(),
}
export function parseListQuery<K extends keyof typeof listSchemas>(kind: K, input: unknown): z.output<typeof listSchemas[K]> {
  const result = listSchemas[kind].safeParse(input)
  if (!result.success) throw new AppError(result.error.issues.map(issue => issue.message).join(', '), 400)
  return result.data as z.output<typeof listSchemas[K]>
}
export function paginated<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}
