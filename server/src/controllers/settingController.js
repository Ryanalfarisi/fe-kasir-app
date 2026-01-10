const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');

// Helper to get formatted settings
exports.getSettings = async (req, res) => {
  try {
    const settingsArr = await prisma.setting.findMany();
    const settings = settingsArr.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    
    // Provide default values if empty
    const defaults = {
      storeName: 'Kasir App',
      storeAddress: 'Jl. Contoh No. 123',
      storePhone: '0812-3456-7890',
      receiptFooter: 'Terima kasih atas kunjungan Anda!',
      storeLogo: null
    };

    res.json({ ...defaults, ...settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body; // Key-value pairs
    
    // Handle Logo Upload if present
    if (req.file) {
      // Store relative path
      const logoPath = `/uploads/${req.file.filename}`;
      updates['storeLogo'] = logoPath;
    }

    const promises = Object.keys(updates).map(async (key) => {
      // Upsert: Create if not exists, Update if exists
      return prisma.setting.upsert({
        where: { key },
        update: { value: updates[key] },
        create: { key, value: updates[key] }
      });
    });

    await Promise.all(promises);
    
    // Return updated settings
    exports.getSettings(req, res);
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ error: error.message });
  }
};
