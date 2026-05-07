"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMatriculaSchema = exports.createMatriculaSchema = void 0;
const zod_1 = require("zod");
exports.createMatriculaSchema = zod_1.z.object({
    beneficiarioId: zod_1.z.string().uuid(),
    aulaId: zod_1.z.string().uuid()
});
exports.updateMatriculaSchema = zod_1.z.object({
    beneficiarioId: zod_1.z.string().uuid().optional(),
    aulaId: zod_1.z.string().uuid().optional()
});
