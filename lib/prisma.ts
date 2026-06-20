import { PrismaClient } from "@prisma/client";

// Singleton obrigatório em ambiente serverless (Vercel/Next.js).
// Sem isso, cada hot-reload cria uma nova instância e esgota as conexões do banco.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
