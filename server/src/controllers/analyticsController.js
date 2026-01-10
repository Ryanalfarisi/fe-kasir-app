const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Total Revenue (All time)
    const totalRevenueAgg = await prisma.transaction.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { totalAmount: true },
    });
    console.log("ANALYTICS: Total Revenue Agg:", totalRevenueAgg);
    const totalRevenue = Number(totalRevenueAgg._sum.totalAmount) || 0;

    // 2. Today's Revenue
    console.log("ANALYTICS: Today's Date Filter:", today);
    const todayRevenueAgg = await prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: today,
        },
        status: 'SUCCESS',
      },
      _sum: { totalAmount: true },
    });
    console.log("ANALYTICS: Today Revenue Agg:", todayRevenueAgg);
    const todayRevenue = Number(todayRevenueAgg._sum.totalAmount) || 0;

    // 3. Transactions Today
    const todayTransactionsCount = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: today,
        },
        status: 'SUCCESS',
      },
    });

    // 4. Low Stock Items
    const lowStockCount = await prisma.item.count({
      where: {
        stock: {
          lte: 5,
        },
      },
    });

    // 5. Last 7 Days Sales Chart Data
    const last7DaysTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        status: 'SUCCESS',
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Process chart data
    const chartData = {};
    // Initialize last 7 days with 0
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
        chartData[dateStr] = 0;
    }

    last7DaysTransactions.forEach((t) => {
        const dateStr = t.createdAt.toISOString().split('T')[0];
        if (chartData[dateStr] !== undefined) {
            chartData[dateStr] += Number(t.totalAmount);
        }
    });

    // Sort by date ascending
    const sortedChartData = Object.entries(chartData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, amount]) => ({ date, amount }));


    res.json({
      totalRevenue,
      todayRevenue,
      todayTransactionsCount,
      lowStockCount,
      salesChart: sortedChartData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
