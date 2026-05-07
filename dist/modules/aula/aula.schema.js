"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAulaSchema = exports.createAulaSchema = void 0;
const zod_1 = require("zod");
exports.createAulaSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1),
    modalidade: zod_1.z.string().min(1),
    vagas: zod_1.z.number().int().positive(),
    instrutorId: zod_1.z.string().uuid().optional()
});
exports.updateAulaSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1).optional(),
    modalidade: zod_1.z.string().min(1).optional(),
    vagas: zod_1.z.number().int().positive().optional(),
    instrutorId: zod_1.z.string().uuid().optional()
});
