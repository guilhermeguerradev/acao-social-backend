"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("./AppError");
const env_1 = require("../config/env");
function getJwtSecret() {
    return (0, env_1.getRequiredEnv)("JWT_SECRET");
}
function generateToken(payload) {
    const expiresIn = (0, env_1.getRequiredEnv)("JWT_EXPIRES_IN");
    const options = {
        expiresIn,
    };
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), {
        ...options,
    });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, getJwtSecret());
    }
    catch {
        throw new AppError_1.AppError("Token invalido", 401);
    }
}
