"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInstrutorSchema = exports.registerMedicoSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().toLowerCase().email(),
    password: zod_1.z.string().min(6)
});
exports.registerMedicoSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
    email: zod_1.z.string().trim().toLowerCase().email(),
    password: zod_1.z.string().min(8).max(72)
});
exports.registerInstrutorSchema = exports.registerMedicoSchema;
