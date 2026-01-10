const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');

dotenv.config();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Kasir App API Ready' });
});

const categoryRoutes = require('./routes/categoryRoutes');
const itemRoutes = require('./routes/itemRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const { authenticateToken, authorizeRole } = require('./middleware/authMiddleware');

// Public Route
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/users', userRoutes); // Protected inside the route file (Admin only)

// Apply Middleware for other routes
// Apply Middleware for other routes
app.use('/api/categories', authenticateToken, categoryRoutes); // Basic Auth
app.use('/api/items', authenticateToken, itemRoutes); // Basic Auth
app.use('/api/transactions', authenticateToken, transactionRoutes); // Basic Auth
app.use('/api/analytics', authenticateToken, authorizeRole(['ADMIN']), analyticsRoutes); // Admin only
app.use('/api/reports', authenticateToken, authorizeRole(['ADMIN']), reportRoutes); // Admin only

const settingRoutes = require('./routes/settingRoutes');
const discountRoutes = require('./routes/discountRoutes');
const demoRequestRoutes = require('./routes/demoRequestRoutes'); // Added

app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));
app.use('/api/settings', authenticateToken, authorizeRole(['ADMIN']), settingRoutes);
app.use('/api/discounts', authenticateToken, discountRoutes);

// Demo Request Routes
app.use('/api/demo-requests', demoRequestRoutes); // Public & Protected mixed inside



// Only listen if run directly (not imported as Vercel function)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
