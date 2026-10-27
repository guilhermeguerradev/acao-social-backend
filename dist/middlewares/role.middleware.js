"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleMiddleware = roleMiddleware;
function roleMiddleware(roles) {
    return (req, res, next) => {
        const user = req
            .user;
        if (!user || !user.role || !(user.role === 'ADMIN' || roles.includes(String(user.role)))) {
            return res.status(403).json({ error: "Acesso negado" });
        }
        return next();
    };
}
