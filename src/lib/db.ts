import { PrismaClient } from '@prisma/client'

console.log('DB_URL_DEBUG:', process.env.DATABASE_URL);


const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
