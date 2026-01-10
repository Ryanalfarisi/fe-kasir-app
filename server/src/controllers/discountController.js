const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllDiscounts = async (req, res) => {
  try {
    const discounts = await prisma.discount.findMany();
    res.json(discounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDiscount = async (req, res) => {
  try {
    const { name, type, value, isActive } = req.body;
    const discount = await prisma.discount.create({
      data: {
        name,
        type, // 'PERCENTAGE' or 'FIXED'
        value: Number(value),
        isActive: isActive !== undefined ? isActive : true,
      },
    });
    res.status(201).json(discount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, value, isActive } = req.body;
    const discount = await prisma.discount.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        value: Number(value),
        isActive,
      },
    });
    res.json(discount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.discount.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Discount deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
