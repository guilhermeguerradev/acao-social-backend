"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../config/prisma");
const AppError_1 = require("../../utils/AppError");
const listQuery_1 = require("../../utils/listQuery");
const demanda_schema_1 = require("./demanda.schema");
const demanda_options_1 = require("./demanda.options");
const demandSelect = {
    id: true,
    description: true,
    status: true,
    requesterId: true,
    createdAt: true,
    requester: { select: { id: true, name: true } },
    phone: true,
    neighborhood: true,
    returnPreference: true,
    category: true,
    otherDescription: true,
    urgent: true,
    contactConsentAt: true,
    contactConsentVersion: true,
    contactConsentText: true,
};
function accessScope(actor) {
    if (!actor.userId)
        throw new AppError_1.AppError('Nao autorizado', 401);
    return actor.role === 'ADMIN' || actor.role === 'MEDICO' || actor.role === 'INSTRUTOR'
        ? {}
        : { requesterId: actor.userId };
}
class DemandService {
    async create(input, actor) {
        if (!actor.userId)
            throw new AppError_1.AppError('Nao autorizado', 401);
        const parsed = demanda_schema_1.createDemandSchema.safeParse(input);
        if (!parsed.success)
            throw new AppError_1.AppError(parsed.error.issues.map(issue => issue.message).join(', '), 400);
        const data = parsed.data;
        const content = {
            description: data.description,
            phone: data.phone,
            neighborhood: data.neighborhood,
            returnPreference: data.returnPreference,
            category: data.category,
            otherDescription: data.otherDescription,
            urgent: data.urgent,
        };
        const sameContent = (record) => Object.entries(content).every(([field, value]) => record[field] === value);
        const where = { requesterId_requestKey: { requesterId: actor.userId, requestKey: data.requestKey } };
        const previous = await prisma_1.prisma.demand.findUnique({ where, select: demandSelect });
        if (previous) {
            if (!sameContent(previous))
                throw new AppError_1.AppError('Este envio ja foi recebido com outro conteudo. Confira as demandas recebidas antes de iniciar outra solicitacao.', 409);
            return { demand: previous, created: false };
        }
        try {
            const demand = await prisma_1.prisma.demand.create({
                data: {
                    ...content,
                    requestKey: data.requestKey,
                    requesterId: actor.userId,
                    contactConsentAt: new Date(),
                    contactConsentVersion: demanda_options_1.demandConsent.version,
                    contactConsentText: demanda_options_1.demandConsent.text,
                },
                select: demandSelect,
            });
            return { demand, created: true };
        }
        catch (error) {
            // Two concurrent retries are arbitrated by the database unique constraint.
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                const existing = await prisma_1.prisma.demand.findUnique({ where, select: demandSelect });
                if (existing && sameContent(existing))
                    return { demand: existing, created: false };
                throw new AppError_1.AppError('Este envio ja foi recebido com outro conteudo. Confira as demandas recebidas antes de iniciar outra solicitacao.', 409);
            }
            throw error;
        }
    }
    async findAll(input, actor) {
        const { page, limit, search } = (0, listQuery_1.parseListQuery)('demanda', input);
        const where = {
            ...accessScope(actor),
            ...(search ? { OR: [
                    { id: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { requester: { name: { contains: search, mode: 'insensitive' } } },
                ] } : {}),
        };
        const [data, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.demand.findMany({
                where,
                select: demandSelect,
                orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma_1.prisma.demand.count({ where }),
        ]);
        return (0, listQuery_1.paginated)(data, total, page, limit);
    }
    async findById(id, actor) {
        const demand = await prisma_1.prisma.demand.findFirst({
            where: { ...accessScope(actor), id },
            select: demandSelect,
        });
        // Do not disclose whether a demand belonging to someone else exists.
        if (!demand)
            throw new AppError_1.AppError('Demanda nao encontrada', 404);
        return demand;
    }
}
exports.DemandService = DemandService;
