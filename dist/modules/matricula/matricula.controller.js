"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatriculaController = void 0;
const matricula_service_1 = require("./matricula.service");
const service = new matricula_service_1.MatriculaService();
class MatriculaController {
    async create(req, res, next) {
        try {
            const result = await service.create(req.body);
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
            const result = await service.update(req.params.id, req.body);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            await service.delete(req.params.id);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }
}
exports.MatriculaController = MatriculaController;
