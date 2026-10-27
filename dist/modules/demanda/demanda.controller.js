"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandController = void 0;
const AppError_1 = require("../../utils/AppError");
const demanda_service_1 = require("./demanda.service");
const demanda_schema_1 = require("./demanda.schema");
const service = new demanda_service_1.DemandService();
function getActor(req) {
    if (!req.user?.userId)
        throw new AppError_1.AppError('Nao autorizado', 401);
    return { userId: req.user.userId, role: req.user.role ?? null };
}
class DemandController {
    async create(req, res) {
        const result = await service.create(req.body, getActor(req));
        return res.status(result.created ? 201 : 200).json(result.demand);
    }
    async findAll(req, res) {
        return res.json(await service.findAll(req.query, getActor(req)));
    }
    async findById(req, res) {
        const id = demanda_schema_1.demandIdSchema.safeParse(req.params.id);
        if (!id.success)
            throw new AppError_1.AppError('Identificador de demanda invalido', 400);
        return res.json(await service.findById(id.data, getActor(req)));
    }
}
exports.DemandController = DemandController;
