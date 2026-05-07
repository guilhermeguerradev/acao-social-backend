"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstrutorController = void 0;
const instrutor_service_1 = require("./instrutor.service");
const service = new instrutor_service_1.InstrutorService();
class InstrutorController {
    async create(req, res, next) {
        try {
            const result = await service.create(req.body.userId);
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
            const result = await service.update(req.params.id, req.body.userId);
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
exports.InstrutorController = InstrutorController;
