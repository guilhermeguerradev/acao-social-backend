"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBeneficiarioSchema = exports.createBeneficiarioSchema = void 0;
const zod_1 = require("zod");
exports.createBeneficiarioSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
    telefone: zod_1.z.string().trim().max(20).optional()
});
exports.updateBeneficiarioSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120).optional(),
    telefone: zod_1.z.string().trim().max(20).optional()
}).strict().refine(data => Object.keys(data).length > 0, { message: "Informe nome ou telefone" });
