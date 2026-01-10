const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const multer = require('multer');
const path = require('path');

// Configure Multer (Reusing logic or importing if I extracted it, but for now defining here or importing from a shared config if exists. 
// Since settingRoutes.js probably has it, I should check if I can reuse or copy. I'll copy for simplicity as I didn't verify a shared config file).

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'item-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.get('/', itemController.getAllItems);
router.post('/', upload.single('image'), itemController.createItem);
router.put('/:id', upload.single('image'), itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

module.exports = router;
