const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'SUCCESS',
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Transform data for easier frontend consumption if needed, 
    // but returning the full transaction object is flexible.
    res.json(transactions);

  } catch (error) {
    console.error('Report Error:', error);
    res.status(500).json({ error: 'Failed to fetch report data' });
  }
};
