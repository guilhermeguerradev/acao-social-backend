"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
const allowedOrigins = (0, env_1.getRequiredEnv)('CORS_ORIGINS')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
// Security headers
app.use((0, helmet_1.default)());
// Rate limiter (basic)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (0, env_1.getOptionalNumberEnv)('RATE_LIMIT_MAX', 100),
    standardHeaders: true,
    legacyHeaders: false,
    skip: req => req.method === 'OPTIONS',
    message: { error: 'Muitas requisicoes. Tente novamente mais tarde.' },
});
app.use(limiter);
app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy' });
});
app.use(express_1.default.json({ limit: (0, env_1.getRequiredEnv)('JSON_BODY_LIMIT') }));
app.use(routes_1.default);
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
