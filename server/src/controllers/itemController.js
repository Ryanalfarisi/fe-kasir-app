const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllItems = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: { category: true },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { name, costPrice, sellingPrice, categoryId } = req.body;
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const item = await prisma.item.create({
      data: {
        name,
        costPrice: Number(req.body.costPrice),
        sellingPrice: Number(req.body.sellingPrice),
        stock: Number(req.body.stock) || 0,
        categoryId: parseInt(categoryId),
        image: imagePath
      },
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, costPrice, sellingPrice, categoryId, stock } = req.body;
    
    // FormData sends strings, ensure numbers are parsed
    const updateData = {
        name,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        stock: Number(stock),
        categoryId: parseInt(categoryId),
    };

    if (req.file) {
        updateData.image = `/uploads/${req.file.filename}`;
    }

    const item = await prisma.item.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.item.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
