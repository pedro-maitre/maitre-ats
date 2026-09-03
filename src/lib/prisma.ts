import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

// Configuração de Pool resiliente para Serverless / Vercel e instâncias em nuvem
function getPool(): Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool;
  }

  const connectionString = process.env.DATABASE_URL;
  const isSupabaseOrProd =
    Boolean(connectionString?.includes("supabase.com")) ||
    Boolean(connectionString?.includes("pooler.supabase.com")) ||
    Boolean(connectionString?.includes("sslmode=require")) ||
    process.env.NODE_ENV === "production";

  const pool = new Pool({
    connectionString: connectionString || undefined,
    ssl: isSupabaseOrProd ? { rejectUnauthorized: false } : undefined,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    allowExitOnIdle: true,
  });

  pool.on("error", (err) => {
    console.error("Prisma Pg Pool Unexpected Error:", err.message);
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
  }

  return pool;
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const pool = getPool();
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
