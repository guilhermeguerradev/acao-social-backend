"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AulaController = void 0;
const aula_service_1 = require("./aula.service");
const service = new aula_service_1.AulaService();
class AulaController {
    async create(req, res, next) {
        try {
            const result = await service.create({
                ...req.body,
                instrutorId: req.user?.instrutorId ?? req.body.instrutorId,
            });
            res.status(201).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async findAll(req, res, next) {
        try {
            const result = await service.findAll();
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
            const result = await service.update(req.params.id, req.body, req.user?.instrutorId);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            await service.delete(req.params.id, req.user?.instrutorId);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AulaController = AulaController;
