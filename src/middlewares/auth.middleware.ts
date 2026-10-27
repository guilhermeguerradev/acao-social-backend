import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../config/prisma";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token nao fornecido" });
    }

    const [, token] = authHeader.split(" ");

    if (!token) {
      return res.status(401).json({ error: "Token invalido" });
    }

    let decoded: JwtPayload | string;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ error: "Nao autorizado" });
    }

    if (typeof decoded === "string") {
      return res.status(401).json({ error: "Nao autorizado" });
    }

    if (!decoded.userId || typeof decoded.userId !== "string") {
      return res.status(401).json({ error: "Token invalido" });
    }

    const user = await prisma.user.findUnique({
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

    (req as Request & { user?: JwtPayload }).user = {
      ...decoded,
      userId: user.id,
      role,
      medicoId: user.medico?.id,
      instrutorId: user.instrutor?.id,
    };
    return next();
  } catch (error) {
    // A database failure is not evidence that the authenticated session is invalid.
    return next(error);
  }
}
