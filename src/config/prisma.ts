import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { getRequiredEnv } from "./env";

const connectionString = getRequiredEnv("DATABASE_URL");

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
