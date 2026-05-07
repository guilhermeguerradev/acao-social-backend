"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
    email: zod_1.z.string().trim().toLowerCase().email(),
    password: zod_1.z.string().min(8).max(72)
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120).optional(),
    email: zod_1.z.string().trim().toLowerCase().email().optional(),
    password: zod_1.z.string().min(8).max(72).optional()
});
