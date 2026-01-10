const express = require('express');
const router = express.Router(); // Fixed: express.Router(), not express.router
const settingController = require('../controllers/settingController');
const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Unique filename: settings-logo-TIMESTAMP.ext
    const ext = path.extname(file.originalname);
    cb(null, `settings-logo-${Date.now()}${ext}`);
  }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only images are allowed'));
        }
        cb(null, true);
    }
});

router.get('/', settingController.getSettings);
router.post('/', upload.single('logo'), settingController.updateSettings);

module.exports = router;
