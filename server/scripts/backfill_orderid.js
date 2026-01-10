const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateOrderId(date) {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TRX-${yyyy}${mm}${dd}-${random}`;
}

async function main() {
  console.log("--- BACKFILLING ORDER IDs ---");
  
  const transactions = await prisma.transaction.findMany({
      where: { orderId: null }
  });
  console.log(`Found ${transactions.length} transactions without orderId`);

  for (const t of transactions) {
      const newOrderId = generateOrderId(t.createdAt);
      await prisma.transaction.update({
          where: { id: t.id },
          data: { orderId: newOrderId }
      });
      console.log(`Updated ID ${t.id} -> ${newOrderId}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
