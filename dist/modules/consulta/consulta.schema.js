"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConsultaSchema = exports.createConsultaSchema = void 0;
const zod_1 = require("zod");
const dateString = zod_1.z
    .string()
    .datetime({ offset: true })
    .or(zod_1.z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Formato de data inválido'
}));
exports.createConsultaSchema = zod_1.z.object({
    medicoId: zod_1.z.string().uuid().optional(),
    beneficiarioId: zod_1.z.string().uuid(),
    dataHora: dateString
});
exports.updateConsultaSchema = zod_1.z.object({
    dataHora: dateString
});
