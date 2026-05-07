"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const AppError_1 = require("../../utils/AppError");
const service = new auth_service_1.AuthService();
class AuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                throw new AppError_1.AppError('Email e password sao obrigatorios', 400);
            }
            const result = await service.login(email, password);
            return res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async registerMedico(req, res, next) {
        try {
            const result = await service.registerMedico(req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async registerInstrutor(req, res, next) {
        try {
            const result = await service.registerInstrutor(req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
