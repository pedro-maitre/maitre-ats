import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

const connectionString = process.env.DATABASE_URL;
const isSupabaseOrProd =
  Boolean(connectionString?.includes("supabase.com")) ||
  Boolean(connectionString?.includes("pooler.supabase.com")) ||
  process.env.NODE_ENV === "production";

// Configuração otimizada para Serverless / Next.js com SSL resiliente
const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString,
    ssl: isSupabaseOrProd ? { rejectUnauthorized: false } : undefined,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
