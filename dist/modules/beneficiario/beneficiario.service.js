"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiarioService = void 0;
const prisma_1 = require("../../config/prisma");
const AppError_1 = require("../../utils/AppError");
const prismaSelect_1 = require("../../utils/prismaSelect");
class BeneficiarioService {
    async create(data) {
        return prisma_1.prisma.beneficiario.create({
            data,
            select: prismaSelect_1.beneficiarioSelect,
        });
    }
    async findAll() {
        return prisma_1.prisma.beneficiario.findMany({
            select: prismaSelect_1.beneficiarioSelect,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async findById(id) {
        const beneficiario = await prisma_1.prisma.beneficiario.findUnique({
            where: { id },
            select: prismaSelect_1.beneficiarioSelect,
        });
        if (!beneficiario) {
            throw new AppError_1.AppError('Beneficiario nao encontrado', 404);
        }
        return beneficiario;
    }
    async delete(id) {
        try {
            await prisma_1.prisma.beneficiario.delete({
                where: { id },
            });
        }
        catch {
            throw new AppError_1.AppError('Beneficiario nao encontrado', 404);
        }
    }
}
exports.BeneficiarioService = BeneficiarioService;
