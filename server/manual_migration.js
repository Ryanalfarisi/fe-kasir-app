const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to create DemoRequest table manually...');
    
    // Check if table exists (optional, but good for safety)
    // Actually just try to create it.
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DemoRequest" (
        "id" SERIAL NOT NULL,
        "email" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('SUCCESS: Table DemoRequest created (or already exists).');
  } catch (e) {
    console.error('ERROR creating table:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
