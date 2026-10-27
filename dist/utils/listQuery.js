"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSchemas = void 0;
exports.parseListQuery = parseListQuery;
exports.paginated = paginated;
const zod_1 = require("zod");
const AppError_1 = require("./AppError");
const pagination = {
    page: zod_1.z.coerce.number().int().min(1).max(1000000).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
};
const uuid = zod_1.z.string().uuid().optional();
const date = zod_1.z.string().datetime({ offset: true }).optional();
exports.listSchemas = {
    beneficiario: zod_1.z.object({ ...pagination, search: zod_1.z.string().trim().max(120).optional() }),
    consulta: zod_1.z.object({ ...pagination, medicoId: uuid, beneficiarioId: uuid, startDate: date, endDate: date })
        .refine(q => !q.startDate || !q.endDate || new Date(q.startDate) <= new Date(q.endDate), { message: 'Intervalo de datas invalido' }),
    aula: zod_1.z.object({ ...pagination, instrutorId: uuid, modalidade: zod_1.z.string().trim().max(120).optional(), available: zod_1.z.enum(['true', 'false']).optional() }),
    matricula: zod_1.z.object({ ...pagination, aulaId: uuid }),
    demanda: zod_1.z.object({ ...pagination, search: zod_1.z.string().trim().max(120).optional() }).strict(),
};
function parseListQuery(kind, input) {
    const result = exports.listSchemas[kind].safeParse(input);
    if (!result.success)
        throw new AppError_1.AppError(result.error.issues.map(issue => issue.message).join(', '), 400);
    return result.data;
}
function paginated(data, total, page, limit) {
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
