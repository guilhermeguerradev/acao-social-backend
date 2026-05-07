"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequiredEnv = getRequiredEnv;
exports.getRequiredNumberEnv = getRequiredNumberEnv;
exports.getOptionalNumberEnv = getOptionalNumberEnv;
function normalizeEnvValue(value) {
    const trimmedValue = value?.trim();
    if (!trimmedValue) {
        return undefined;
    }
    const firstChar = trimmedValue[0];
    const lastChar = trimmedValue[trimmedValue.length - 1];
    if (trimmedValue.length >= 2 &&
        ((firstChar === '"' && lastChar === '"') || (firstChar === "'" && lastChar === "'"))) {
        return trimmedValue.slice(1, -1).trim();
    }
    return trimmedValue;
}
function getRequiredEnv(name) {
    const value = normalizeEnvValue(process.env[name]);
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
    const rawValue = normalizeEnvValue(process.env[name]);
    if (!rawValue) {
        return defaultValue;
    }
    const value = Number(rawValue);
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`Environment variable ${name} must be a positive integer`);
    }
    return value;
}
