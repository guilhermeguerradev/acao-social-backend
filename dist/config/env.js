"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequiredEnv = getRequiredEnv;
exports.getRequiredNumberEnv = getRequiredNumberEnv;
exports.getOptionalNumberEnv = getOptionalNumberEnv;
function getRequiredEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
function getRequiredNumberEnv(name) {
    const rawValue = getRequiredEnv(name);
    const value = Number(rawValue);
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`Environment variable ${name} must be a positive integer`);
    }
    return value;
}
function getOptionalNumberEnv(name, defaultValue) {
    const rawValue = process.env[name]?.trim();
    if (!rawValue) {
        return defaultValue;
    }
    const value = Number(rawValue);
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`Environment variable ${name} must be a positive integer`);
    }
    return value;
}
