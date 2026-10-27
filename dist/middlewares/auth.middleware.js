"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../config/prisma");
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Token nao fornecido" });
        }
        const [, token] = authHeader.split(" ");
        if (!token) {
            return res.status(401).json({ error: "Token invalido" });
        }
        let decoded;
        try {
            decoded = (0, jwt_1.verifyToken)(token);
        }
        catch {
            return res.status(401).json({ error: "Nao autorizado" });
        }
        if (typeof decoded === "string") {
            return res.status(401).json({ error: "Nao autorizado" });
        }
        if (!decoded.userId || typeof decoded.userId !== "string") {
            return res.status(401).json({ error: "Token invalido" });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                isAdmin: true,
                id: true,
                medico: { select: { id: true } },
                instrutor: { select: { id: true } },
            },
        });
        if (!user) {
            return res.status(401).json({ error: "Nao autorizado" });
        }
        const role = user.isAdmin ? "ADMIN" : user.medico ? "MEDICO" : user.instrutor ? "INSTRUTOR" : null;
        req.user = {
            ...decoded,
            userId: user.id,
            role,
            medicoId: user.medico?.id,
            instrutorId: user.instrutor?.id,
        };
        return next();
    }
    catch (error) {
        // A database failure is not evidence that the authenticated session is invalid.
        return next(error);
    }
}
