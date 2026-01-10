const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find the most recently created user
  const user = await prisma.user.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!user) {
    console.log('No users found.');
    return;
  }

  console.log(`Found most recent user: ${user.name} (${user.email}) - Role: ${user.role}`);

  if (user.role !== 'ADMIN') {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });
    console.log(`SUCCESS: User ${updated.name} promoted to ADMIN.`);
  } else {
    console.log('User is already ADMIN.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
