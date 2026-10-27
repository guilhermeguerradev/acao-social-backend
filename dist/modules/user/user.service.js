"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = require("../../config/prisma");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AppError_1 = require("../../utils/AppError");
const prismaSelect_1 = require("../../utils/prismaSelect");
class UserService {
    async create(data) {
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
                password: hash
            },
            select: {
                ...prismaSelect_1.publicUserSelect,
                medico: { select: { id: true } },
                instrutor: { select: { id: true } }
            }
        });
    }
    async findAll() {
        return prisma_1.prisma.user.findMany({
            select: {
                ...prismaSelect_1.publicUserSelect,
                medico: { select: { id: true } },
                instrutor: { select: { id: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async findById(id) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                ...prismaSelect_1.publicUserSelect,
                medico: { select: { id: true } },
                instrutor: { select: { id: true } }
            }
        });
        if (!user) {
            throw new AppError_1.AppError('Usuario nao encontrado', 404);
        }
        return user;
    }
    async update(id, data, actor) {
        const target = await this.findById(id);
        if (target.isAdmin && actor?.role !== 'ADMIN')
            throw new AppError_1.AppError('Apenas administradores podem alterar esta conta', 403);
        if (data.email) {
            const exists = await prisma_1.prisma.user.findUnique({
                where: { email: data.email }
            });
            if (exists && exists.id !== id) {
                throw new AppError_1.AppError('Email ja cadastrado', 400);
            }
        }
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.password)
            updateData.password = await bcryptjs_1.default.hash(data.password, 12);
        try {
            return await prisma_1.prisma.user.update({
                where: { id },
                data: updateData,
                select: {
                    ...prismaSelect_1.publicUserSelect,
                    medico: { select: { id: true } },
                    instrutor: { select: { id: true } }
                }
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025')
                    throw new AppError_1.AppError('Usuario nao encontrado', 404);
                if (error.code === 'P2002')
                    throw new AppError_1.AppError('Email ja cadastrado', 409);
            }
            throw error;
        }
    }
    async delete(id, actor) {
        const target = await this.findById(id);
        if (actor?.userId === id)
            throw new AppError_1.AppError('Nao e permitido excluir sua propria conta', 409);
        if (target.isAdmin && actor?.role !== 'ADMIN')
            throw new AppError_1.AppError('Apenas administradores podem remover esta conta', 403);
        try {
            await prisma_1.prisma.$transaction(async (tx) => {
                // Remove only empty professional profiles; FK restrictions preserve clinical,
                // course and demand history and roll back the entire deletion on conflict.
                await tx.medico.deleteMany({ where: { userId: id } });
                await tx.instrutor.deleteMany({ where: { userId: id } });
                await tx.user.delete({ where: { id } });
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003')
                    throw new AppError_1.AppError('Usuario possui dependencias e nao pode ser removido', 409);
                if (error.code === 'P2025')
                    throw new AppError_1.AppError('Usuario nao encontrado', 404);
            }
            throw error;
        }
    }
}
exports.UserService = UserService;
