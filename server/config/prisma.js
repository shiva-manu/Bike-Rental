import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
import "dotenv/config";

const { Pool } = pkg;

// ❌ DO NOT use DATABASE_URL on Vercel
// ✅ Use Supabase TRANSACTION POOLER
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_POOL_URL is not defined");
}

// 🔒 Prevent multiple Prisma instances in serverless
let prisma;

if (!global.prisma) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);

  global.prisma = new PrismaClient({ adapter });
}

prisma = global.prisma;

export default prisma;
