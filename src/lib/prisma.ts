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
    max: 3, // Em ambiente Serverless (Vercel Lambdas), manter número pequeno de conexões por instância
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });

  pool.on("error", (err) => {
    console.error("Prisma Pg Pool Unexpected Error:", err.message);
  });

  // Reutiliza em instâncias warm tanto em dev quanto em prod
  globalForPrisma.pool = pool;

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

  globalForPrisma.prisma = client;

  return client;
}

export const prisma = getPrismaClient();
