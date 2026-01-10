const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--- CHECKING TRANSACTIONS ---");
  
  const allTransactions = await prisma.transaction.findMany({});
  console.log(`Total Transactions: ${allTransactions.length}`);

  const successTransactions = await prisma.transaction.findMany({
      where: { status: 'SUCCESS' }
  });
  console.log(`SUCCESS Transactions: ${successTransactions.length}`);

  const today = new Date();
  today.setHours(0,0,0,0);
  console.log(`Filter Date (Today): ${today.toISOString()}`);

  const todayTransactions = await prisma.transaction.findMany({
      where: { 
          status: 'SUCCESS',
          createdAt: {
              gte: today
          }
      }
  });
  console.log(`Today's SUCCESS Transactions: ${todayTransactions.length}`);

  if (allTransactions.length > 0) {
      console.log("Sample Transaction:", allTransactions[0]);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
