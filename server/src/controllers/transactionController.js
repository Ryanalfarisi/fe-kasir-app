const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createTransaction = async (req, res) => {
  try {
    const { items, paymentMethod, totalAmount: clientTotal, note, discountId } = req.body; 

    // Generate Custom Order ID
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `TRX-${yyyy}${mm}${dd}-${random}`;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty' });
    }

    const initialStatus = paymentMethod === 'QRIS' ? 'PENDING' : 'SUCCESS';

    const result = await prisma.$transaction(async (prisma) => {
      // 1. Calculate Real Subtotal from DB (Security) & Validate Stock
      let subtotal = 0;
      const transactionItems = [];

      for (const item of items) {
        const dbItem = await prisma.item.findUnique({ where: { id: item.id } });
        if (!dbItem) throw new Error(`Item ${item.id} not found`);
        if (dbItem.stock < item.quantity) throw new Error(`Stok kurang untuk: ${dbItem.name}`);
        
        // Deduct stock
        await prisma.item.update({
            where: { id: item.id },
            data: { stock: { decrement: item.quantity } }
        });

        // Calculate based on DB price
        const lineTotal = Number(dbItem.sellingPrice) * item.quantity;
        subtotal += lineTotal;

        transactionItems.push({
            item: { connect: { id: item.id } },
            quantity: item.quantity,
            price: dbItem.sellingPrice,
            costPrice: dbItem.costPrice,
        });
      }

      // 2. Apply Discount
      let discountTotal = 0;
      if (discountId) {
          const dbDiscount = await prisma.discount.findUnique({ where: { id: discountId } });
          if (dbDiscount && dbDiscount.isActive) {
              if (dbDiscount.type === 'PERCENTAGE') {
                  discountTotal = subtotal * (Number(dbDiscount.value) / 100);
              } else {
                  discountTotal = Number(dbDiscount.value);
              }
          }
      }

      // Ensure discount doesn't exceed subtotal
      if (discountTotal > subtotal) discountTotal = subtotal;
      
      const finalTotal = subtotal - discountTotal;

      // 3. Create Transaction
      const transaction = await prisma.transaction.create({
        data: {
          orderId,
          totalAmount: finalTotal, // Use server-calculated total
          paymentMethod,
          status: initialStatus,
          note,
          discountId,
          discountTotal,
          items: {
            create: transactionItems
          },
        },
        include: { items: true, discount: true },
      });

      return transaction;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('TRANSACTION ERROR:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // SUCCESS, FAILED

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    });

    if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    if (transaction.status === status) {
        return res.json(transaction); // No change
    }

    // Logic: If PENDING -> FAILED, return stock
    if (transaction.status === 'PENDING' && status === 'FAILED') {
        const result = await prisma.$transaction(async (prisma) => {
            const updated = await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status }
            });

            // Return stock
            for (const item of transaction.items) {
                await prisma.item.update({
                    where: { id: item.itemId },
                    data: { stock: { increment: item.quantity } }
                });
            }
            return updated;
        });
        return res.json(result);
    } 
    
    // If PENDING -> SUCCESS, just update status (Stock already deducted)
    const updated = await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status }
    });



    res.json(updated);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    // Search filter (OrderId)
    if (search) {
        where.orderId = { contains: search };
    }

    // Date filter
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end date

        where.createdAt = {
            gte: start,
            lte: end
        };
    }

    // Count total for pagination
    const totalCount = await prisma.transaction.count({ where });

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        items: {
          include: {
            item: true
          }
        },
        discount: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    res.json({
        data: transactions,
        pagination: {
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCount / limit)
        }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
