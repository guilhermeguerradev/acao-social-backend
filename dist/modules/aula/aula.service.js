"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AulaService = void 0;
const prisma_1 = require("../../config/prisma");
const AppError_1 = require("../../utils/AppError");
const prismaSelect_1 = require("../../utils/prismaSelect");
const aulaSelect = {
    id: true,
    titulo: true,
    modalidade: true,
    vagas: true,
    instrutorId: true,
    createdAt: true,
    instrutor: { select: prismaSelect_1.instrutorWithUserSelect },
    _count: { select: { matriculas: true } },
};
class AulaService {
    async create(data) {
        const instrutor = await prisma_1.prisma.instrutor.findUnique({
            where: { id: data.instrutorId }
        });
        if (!instrutor) {
            throw new AppError_1.AppError('Instrutor nao encontrado', 404);
        }
        return prisma_1.prisma.aula.create({
            data,
            select: aulaSelect,
        });
    }
    async findAll() {
        return prisma_1.prisma.aula.findMany({
            select: aulaSelect,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async findById(id) {
        const aula = await prisma_1.prisma.aula.findUnique({
            where: { id },
            select: aulaSelect,
        });
        if (!aula) {
            throw new AppError_1.AppError('Aula nao encontrada', 404);
        }
        return aula;
    }
    async update(id, data, requesterInstrutorId) {
        const aula = await prisma_1.prisma.aula.findUnique({
            where: { id },
            select: {
                id: true,
                instrutorId: true,
                _count: { select: { matriculas: true } },
            }
        });
        if (!aula) {
            throw new AppError_1.AppError('Aula nao encontrada', 404);
        }
        if (requesterInstrutorId && aula.instrutorId !== requesterInstrutorId) {
            throw new AppError_1.AppError('Acesso negado', 403);
        }
        if (data.instrutorId && data.instrutorId !== aula.instrutorId) {
            throw new AppError_1.AppError('Nao e permitido transferir aula entre instrutores', 403);
        }
        if (data.vagas !== undefined && data.vagas < aula._count.matriculas) {
            throw new AppError_1.AppError('Vagas nao podem ser menores que numero de matriculados', 400);
        }
        return prisma_1.prisma.aula.update({
            where: { id },
            data: {
                titulo: data.titulo,
                modalidade: data.modalidade,
                vagas: data.vagas,
            },
            select: aulaSelect,
        });
    }
    async delete(id, requesterInstrutorId) {
        const aula = await prisma_1.prisma.aula.findUnique({
            where: { id },
            select: { instrutorId: true },
        });
        if (!aula) {
            throw new AppError_1.AppError('Aula nao encontrada', 404);
        }
        if (requesterInstrutorId && aula.instrutorId !== requesterInstrutorId) {
            throw new AppError_1.AppError('Acesso negado', 403);
        }
        try {
            await prisma_1.prisma.aula.delete({
                where: { id }
            });
        }
        catch {
            throw new AppError_1.AppError('Aula possui dependencias e nao pode ser removida', 409);
        }
    }
}
exports.AulaService = AulaService;
