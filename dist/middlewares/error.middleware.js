"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const AppError_1 = require("../utils/AppError");
const client_1 = require("@prisma/client");
function errorMiddleware(err, req, res, next) {
    console.error(err);
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            error: err.message
        });
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025')
            return res.status(404).json({ error: 'Registro nao encontrado' });
        if (err.code === 'P2002')
            return res.status(409).json({ error: 'Registro duplicado ou horario indisponivel' });
        if (err.code === 'P2003')
            return res.status(409).json({ error: 'Registro possui dependencias' });
        if (err.code === 'P2034')
            return res.status(409).json({ error: 'Dados alterados por outra operacao. Atualize e tente novamente.' });
    }
    return res.status(500).json({
        error: 'Erro interno do servidor'
    });
}
