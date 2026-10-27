"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiarioService = void 0;
const listQuery_1 = require("../../utils/listQuery");
const prisma_1 = require("../../config/prisma");
const client_1 = require("@prisma/client");
const AppError_1 = require("../../utils/AppError");
const prismaSelect_1 = require("../../utils/prismaSelect");
class BeneficiarioService {
    async create(data) {
        return prisma_1.prisma.beneficiario.create({
            data,
            select: prismaSelect_1.beneficiarioSelect,
        });
    }
    async findAll(input = {}) {
        const query = (0, listQuery_1.parseListQuery)('beneficiario', input);
        const { page, limit } = query;
        const where = query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {};
        const [data, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.beneficiario.findMany({ where, select: prismaSelect_1.beneficiarioSelect, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
            prisma_1.prisma.beneficiario.count({ where }),
        ]);
        return (0, listQuery_1.paginated)(data, total, page, limit);
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
    async update(id, data) {
        await this.findById(id);
        return prisma_1.prisma.beneficiario.update({
            where: { id },
            data: { name: data.name, telefone: data.telefone },
            select: prismaSelect_1.beneficiarioSelect,
        });
    }
    async delete(id) {
        await this.findById(id);
        try {
            await prisma_1.prisma.beneficiario.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003')
                    throw new AppError_1.AppError('Beneficiario possui dependencias e nao pode ser removido', 409);
                if (error.code === 'P2025')
                    throw new AppError_1.AppError('Beneficiario nao encontrado', 404);
            }
            throw error;
        }
    }
}
exports.BeneficiarioService = BeneficiarioService;
