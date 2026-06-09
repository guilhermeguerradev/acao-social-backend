"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const AppError_1 = require("../utils/AppError");
function errorMiddleware(err, req, res, next) {
    console.error(err);
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            error: err.message
        });
    }
    return res.status(500).json({
        error: 'Erro interno do servidor'
    });
}
