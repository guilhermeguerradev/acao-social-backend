import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { AppError } from "./AppError";
import { getRequiredEnv } from "../config/env";

function getJwtSecret(): string {
  return getRequiredEnv("JWT_SECRET");
}

export function generateToken(payload: object): string {
  const expiresIn = getRequiredEnv("JWT_EXPIRES_IN") as SignOptions["expiresIn"];
  const options: SignOptions = {
    expiresIn,
  };

  return jwt.sign(payload, getJwtSecret(), {
    ...options,
  });
}

export function verifyToken(token: string): jwt.JwtPayload | string {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    throw new AppError("Token invalido", 401);
  }
}
