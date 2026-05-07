"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicoService = void 0;
const prisma_1 = require("../../config/prisma");
const AppError_1 = require("../../utils/AppError");
const prismaSelect_1 = require("../../utils/prismaSelect");
class MedicoService {
    async create(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                medico: { select: { id: true } },
            }
        });
        if (!user) {
            throw new AppError_1.AppError('Usuario nao encontrado', 404);
        }
        if (user.medico) {
            throw new AppError_1.AppError('Usuario ja e medico', 400);
        }
        return prisma_1.prisma.medico.create({
            data: { userId },
            select: prismaSelect_1.medicoWithUserSelect,
        });
    }
    async findAll() {
        return prisma_1.prisma.medico.findMany({
            select: prismaSelect_1.medicoWithUserSelect,
            take: 100,
        });
    }
    async findById(id) {
        const medico = await prisma_1.prisma.medico.findUnique({
            where: { id },
            select: prismaSelect_1.medicoWithUserSelect,
        });
        if (!medico) {
            throw new AppError_1.AppError('Medico nao encontrado', 404);
        }
        return medico;
    }
    async update(id, userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                medico: { select: { id: true } },
            }
        });
        if (!user) {
            throw new AppError_1.AppError('Usuario nao encontrado', 404);
        }
        if (user.medico && user.medico.id !== id) {
            throw new AppError_1.AppError('Usuario ja e medico', 400);
        }
        return prisma_1.prisma.medico.update({
            where: { id },
            data: { userId },
            select: prismaSelect_1.medicoWithUserSelect,
        });
    }
    async delete(id) {
        try {
            await prisma_1.prisma.medico.delete({
                where: { id }
            });
        }
        catch {
            throw new AppError_1.AppError('Medico nao encontrado', 404);
        }
    }
}
exports.MedicoService = MedicoService;
