"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatriculaService = void 0;
const listQuery_1 = require("../../utils/listQuery");
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const AppError_1 = require("../../utils/AppError");
const prismaSelect_1 = require("../../utils/prismaSelect");
const matriculaSelect = {
    id: true,
    beneficiarioId: true,
    aulaId: true,
    createdAt: true,
    beneficiario: { select: prismaSelect_1.beneficiarioSelect },
    aula: {
        select: {
            id: true,
            titulo: true,
            modalidade: true,
            vagas: true,
            instrutorId: true,
            createdAt: true,
        },
    },
};
class MatriculaService {
    async create(data) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const [aula, beneficiario] = await Promise.all([
                    tx.aula.findUnique({
                        where: { id: data.aulaId },
                        select: {
                            id: true,
                            vagas: true,
                            _count: { select: { matriculas: true } },
                        }
                    }),
                    tx.beneficiario.findUnique({
                        where: { id: data.beneficiarioId },
                        select: { id: true },
                    })
                ]);
                if (!aula) {
                    throw new AppError_1.AppError('Aula nao encontrada', 404);
                }
                if (!beneficiario) {
                    throw new AppError_1.AppError('Beneficiario nao encontrado', 404);
                }
                if (aula._count.matriculas >= aula.vagas) {
                    throw new AppError_1.AppError('Limite de vagas atingido', 400);
                }
                return tx.matricula.create({
                    data,
                    select: matriculaSelect,
                });
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (err) {
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError('Beneficiario ja matriculado ou limite de vagas atingido', 409);
        }
    }
    async findAll(input = {}) {
        const query = (0, listQuery_1.parseListQuery)('matricula', input);
        const { page, limit } = query;
        const where = { aulaId: query.aulaId };
        const [data, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.matricula.findMany({ where, select: matriculaSelect, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
            prisma_1.prisma.matricula.count({ where }),
        ]);
        return (0, listQuery_1.paginated)(data, total, page, limit);
    }
    async findById(id) {
        const matricula = await prisma_1.prisma.matricula.findUnique({
            where: { id },
            select: matriculaSelect,
        });
        if (!matricula) {
            throw new AppError_1.AppError('Matricula nao encontrada', 404);
        }
        return matricula;
    }
    async update(id, data) {
        try {
            return await prisma_1.prisma.$transaction(async (tx) => {
                const current = await tx.matricula.findUnique({
                    where: { id },
                    select: { id: true, aulaId: true, beneficiarioId: true },
                });
                if (!current) {
                    throw new AppError_1.AppError('Matricula nao encontrada', 404);
                }
                const nextAulaId = data.aulaId ?? current.aulaId;
                const nextBeneficiarioId = data.beneficiarioId ?? current.beneficiarioId;
                const [aula, beneficiario] = await Promise.all([
                    tx.aula.findUnique({
                        where: { id: nextAulaId },
                        select: {
                            id: true,
                            vagas: true,
                            _count: { select: { matriculas: true } },
                        },
                    }),
                    tx.beneficiario.findUnique({
                        where: { id: nextBeneficiarioId },
                        select: { id: true },
                    }),
                ]);
                if (!aula)
                    throw new AppError_1.AppError('Aula nao encontrada', 404);
                if (!beneficiario)
                    throw new AppError_1.AppError('Beneficiario nao encontrado', 404);
                if (nextAulaId !== current.aulaId && aula._count.matriculas >= aula.vagas) {
                    throw new AppError_1.AppError('Limite de vagas atingido', 400);
                }
                return tx.matricula.update({
                    where: { id },
                    data,
                    select: matriculaSelect,
                });
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (err) {
            if (err instanceof AppError_1.AppError)
                throw err;
            throw new AppError_1.AppError('Matricula duplicada ou invalida', 409);
        }
    }
    async delete(id) {
        try {
            await prisma_1.prisma.matricula.delete({
                where: { id }
            });
        }
        catch {
            throw new AppError_1.AppError('Matricula nao encontrada', 404);
        }
    }
}
exports.MatriculaService = MatriculaService;
