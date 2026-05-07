"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../../config/prisma");
const jwt_1 = require("../../utils/jwt");
const AppError_1 = require("../../utils/AppError");
const prismaSelect_1 = require("../../utils/prismaSelect");
class AuthService {
    async login(email, password) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                medico: { select: { id: true } },
                instrutor: { select: { id: true } },
            },
        });
        if (!user) {
            throw new AppError_1.AppError('Credenciais invalidas', 401);
        }
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            throw new AppError_1.AppError('Credenciais invalidas', 401);
        }
        const role = user.medico ? 'MEDICO' : user.instrutor ? 'INSTRUTOR' : null;
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            role,
        });
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role,
            },
        };
    }
    async registerMedico(data) {
        const exists = await prisma_1.prisma.user.findUnique({
            where: { email: data.email }
        });
        if (exists) {
            throw new AppError_1.AppError('Email ja cadastrado', 400);
        }
        const hash = await bcryptjs_1.default.hash(data.password, 12);
        return prisma_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hash,
                medico: {
                    create: {},
                },
            },
            select: {
                ...prismaSelect_1.publicUserSelect,
                medico: { select: { id: true } }
            }
        });
    }
    async registerInstrutor(data) {
        const exists = await prisma_1.prisma.user.findUnique({
            where: { email: data.email }
        });
        if (exists) {
            throw new AppError_1.AppError('Email ja cadastrado', 400);
        }
        const hash = await bcryptjs_1.default.hash(data.password, 12);
        return prisma_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hash,
                instrutor: {
                    create: {},
                },
            },
            select: {
                ...prismaSelect_1.publicUserSelect,
                instrutor: { select: { id: true } }
            }
        });
    }
}
exports.AuthService = AuthService;
