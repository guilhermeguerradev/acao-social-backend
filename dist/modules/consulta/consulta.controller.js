"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultaController = void 0;
const consulta_service_1 = require("./consulta.service");
const service = new consulta_service_1.ConsultaService();
class ConsultaController {
    async create(req, res, next) {
        try {
            const result = await service.create({
                ...req.body,
                medicoId: req.user?.medicoId ?? req.body.medicoId,
                dataHora: new Date(req.body.dataHora)
            });
            res.status(201).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async findAll(req, res, next) {
        try {
            const result = await service.findAll(req.query);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async findById(req, res, next) {
        try {
            const result = await service.findById(req.params.id);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async update(req, res, next) {
        try {
            const result = await service.update(req.params.id, new Date(req.body.dataHora), req.user?.medicoId);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            await service.delete(req.params.id, req.user?.medicoId);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ConsultaController = ConsultaController;
