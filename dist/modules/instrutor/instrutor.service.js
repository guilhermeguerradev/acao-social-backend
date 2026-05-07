"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrutorService = void 0;
const prisma_1 = require("../../config/prisma");
const AppError_1 = require("../../utils/AppError");
const prismaSelect_1 = require("../../utils/prismaSelect");
class InstrutorService {
    async create(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                instrutor: { select: { id: true } },
            }
        });
        if (!user) {
            throw new AppError_1.AppError('Usuario nao encontrado', 404);
        }
        if (user.instrutor) {
            throw new AppError_1.AppError('Usuario ja e instrutor', 400);
        }
        return prisma_1.prisma.instrutor.create({
            data: { userId },
            select: prismaSelect_1.instrutorWithUserSelect,
        });
    }
    async findAll() {
        return prisma_1.prisma.instrutor.findMany({
            select: prismaSelect_1.instrutorWithUserSelect,
            take: 100,
        });
    }
    async findById(id) {
        const instrutor = await prisma_1.prisma.instrutor.findUnique({
            where: { id },
            select: prismaSelect_1.instrutorWithUserSelect,
        });
        if (!instrutor) {
            throw new AppError_1.AppError('Instrutor nao encontrado', 404);
        }
        return instrutor;
    }
    async update(id, userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                instrutor: { select: { id: true } },
            }
        });
        if (!user) {
            throw new AppError_1.AppError('Usuario nao encontrado', 404);
        }
        if (user.instrutor && user.instrutor.id !== id) {
            throw new AppError_1.AppError('Usuario ja e instrutor', 400);
        }
        return prisma_1.prisma.instrutor.update({
            where: { id },
            data: { userId },
            select: prismaSelect_1.instrutorWithUserSelect,
        });
    }
    async delete(id) {
        try {
            await prisma_1.prisma.instrutor.delete({
                where: { id }
            });
        }
        catch {
            throw new AppError_1.AppError('Instrutor nao encontrado', 404);
        }
    }
}
exports.InstrutorService = InstrutorService;
