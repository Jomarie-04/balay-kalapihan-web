import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import { authenticate } from './middleware.js';

// Import routes
import authRoutes from './routes/auth.js';
import ordersRoutes from './routes/orders.js';
import menuRoutes from './routes/menu.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`\n🚀 Balay Kalapihan API Server running on http://localhost:${PORT}`);
      console.log(`📝 API Documentation:`);
      console.log(`   - Auth: POST /api/auth/signup, /api/auth/login, GET /api/auth/profile`);
      console.log(`   - Menu: GET /api/menu, POST /api/menu (admin), PUT /api/menu/:id (admin), DELETE /api/menu/:id (admin)`);
      console.log(`   - Orders: GET /api/orders, POST /api/orders, PATCH /api/orders/:id/status (admin)`);
      console.log(`   - Health: GET /api/health\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
