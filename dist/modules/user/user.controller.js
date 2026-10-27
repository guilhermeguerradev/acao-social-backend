"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("./user.service");
const user_schema_1 = require("./user.schema");
const AppError_1 = require("../../utils/AppError");
const service = new user_service_1.UserService();
class UserController {
    async updateMe(req, res, next) {
        try {
            if (!req.user?.userId)
                throw new AppError_1.AppError('Nao autorizado', 401);
            res.json(await service.update(req.user.userId, req.body, req.user));
        }
        catch (err) {
            next(err);
        }
    }
    async promoteAdmin(req, res, next) {
        try {
            const id = user_schema_1.userIdSchema.safeParse(req.params.id);
            if (!id.success)
                throw new AppError_1.AppError('Identificador de usuario invalido', 400);
            res.json(await service.promoteAdmin(id.data, req.user));
        }
        catch (err) {
            next(err);
        }
    }
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
            const result = await service.update(req.params.id, req.body, req.user);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async delete(req, res, next) {
        try {
            await service.delete(req.params.id, req.user);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UserController = UserController;
