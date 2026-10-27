"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultaService = void 0;
const listQuery_1 = require("../../utils/listQuery");
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const AppError_1 = require("../../utils/AppError");
const prismaSelect_1 = require("../../utils/prismaSelect");
const consultaSelect = {
    id: true,
    dataHora: true,
    medicoId: true,
    beneficiarioId: true,
    createdAt: true,
    medico: { select: prismaSelect_1.medicoWithUserSelect },
    beneficiario: { select: prismaSelect_1.beneficiarioSelect },
};
function parseDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new AppError_1.AppError('Data invalida', 400);
    }
    return date;
}
class ConsultaService {
    async create(data) {
        const dataHora = parseDate(data.dataHora);
        const [medico, beneficiario] = await Promise.all([
            prisma_1.prisma.medico.findUnique({ where: { id: data.medicoId } }),
            prisma_1.prisma.beneficiario.findUnique({ where: { id: data.beneficiarioId } })
        ]);
        if (!medico)
            throw new AppError_1.AppError('Medico nao encontrado', 404);
        if (!beneficiario)
            throw new AppError_1.AppError('Beneficiario nao encontrado', 404);
        if (dataHora < new Date()) {
            throw new AppError_1.AppError('Nao e possivel agendar consulta no passado', 400);
        }
        const conflito = await prisma_1.prisma.consulta.findFirst({
            where: {
                medicoId: data.medicoId,
                dataHora
            },
            select: { id: true },
        });
        if (conflito) {
            throw new AppError_1.AppError('Horario indisponivel', 409);
        }
        return prisma_1.prisma.consulta.create({
            data: {
                medicoId: data.medicoId,
                beneficiarioId: data.beneficiarioId,
                dataHora
            },
            select: consultaSelect,
        });
    }
    async findAll(input = {}) {
        const query = (0, listQuery_1.parseListQuery)('consulta', input);
        const { page, limit } = query;
        const where = { medicoId: query.medicoId, beneficiarioId: query.beneficiarioId, dataHora: { gte: query.startDate ? new Date(query.startDate) : undefined, lte: query.endDate ? new Date(query.endDate) : undefined } };
        const [data, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.consulta.findMany({ where, select: consultaSelect, orderBy: [{ dataHora: 'asc' }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }),
            prisma_1.prisma.consulta.count({ where }),
        ]);
        return (0, listQuery_1.paginated)(data, total, page, limit);
    }
    async findById(id) {
        const consulta = await prisma_1.prisma.consulta.findUnique({
            where: { id },
            select: consultaSelect,
        });
        if (!consulta) {
            throw new AppError_1.AppError('Consulta nao encontrada', 404);
        }
        return consulta;
    }
    async update(id, dataHora, requesterMedicoId) {
        const consulta = await prisma_1.prisma.consulta.findUnique({
            where: { id },
            select: { id: true, medicoId: true },
        });
        if (!consulta) {
            throw new AppError_1.AppError('Consulta nao encontrada', 404);
        }
        if (!requesterMedicoId || consulta.medicoId !== requesterMedicoId) {
            throw new AppError_1.AppError('Acesso negado', 403);
        }
        const parsedDate = parseDate(dataHora);
        if (parsedDate < new Date()) {
            throw new AppError_1.AppError('Nao e possivel agendar consulta no passado', 400);
        }
        const conflito = await prisma_1.prisma.consulta.findFirst({
            where: {
                medicoId: consulta.medicoId,
                dataHora: parsedDate,
                NOT: { id }
            },
            select: { id: true },
        });
        if (conflito) {
            throw new AppError_1.AppError('Horario indisponivel', 409);
        }
        try {
            return await prisma_1.prisma.consulta.update({
                where: { id },
                data: { dataHora: parsedDate },
                select: consultaSelect,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
                throw new AppError_1.AppError('Horario indisponivel', 409);
            throw error;
        }
    }
    async delete(id, requesterMedicoId) {
        const consulta = await prisma_1.prisma.consulta.findUnique({
            where: { id },
            select: { medicoId: true },
        });
        if (!consulta) {
            throw new AppError_1.AppError('Consulta nao encontrada', 404);
        }
        if (!requesterMedicoId || consulta.medicoId !== requesterMedicoId) {
            throw new AppError_1.AppError('Acesso negado', 403);
        }
        await prisma_1.prisma.consulta.delete({
            where: { id }
        });
    }
}
exports.ConsultaService = ConsultaService;
