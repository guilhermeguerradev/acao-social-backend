import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { getRequiredEnv } from "./env";

const connectionString = getRequiredEnv("DATABASE_URL");
const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString,
  ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
