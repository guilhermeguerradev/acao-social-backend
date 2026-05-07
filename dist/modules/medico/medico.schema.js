"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMedicoSchema = exports.createMedicoSchema = void 0;
const zod_1 = require("zod");
exports.createMedicoSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid()
});
exports.updateMedicoSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid()
});
