import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

export function roleMiddleware(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: JwtPayload & { role?: string | null } })
      .user;

    if (!user || !user.role || !(user.role === 'ADMIN' || roles.includes(String(user.role)))) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    return next();
  };
}
