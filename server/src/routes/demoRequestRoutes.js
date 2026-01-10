const express = require('express');
const router = express.Router();
const controller = require('../controllers/demoRequestController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Public
router.post('/', controller.createRequest);

// Admin Only
router.get('/', authenticateToken, authorizeRole(['ADMIN']), controller.getRequests);
router.post('/:id/approve', authenticateToken, authorizeRole(['ADMIN']), controller.approveRequest);

module.exports = router;
