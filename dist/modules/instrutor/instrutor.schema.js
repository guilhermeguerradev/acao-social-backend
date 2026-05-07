"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInstrutorSchema = exports.createInstrutorSchema = void 0;
const zod_1 = require("zod");
exports.createInstrutorSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid()
});
exports.updateInstrutorSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid()
});
