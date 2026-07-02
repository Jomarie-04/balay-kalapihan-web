import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
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

// Ensure upload directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const proofDir = path.join(uploadsDir, 'payment-proofs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

if (!fs.existsSync(proofDir)) {
  fs.mkdirSync(proofDir, { recursive: true });
  console.log('Created payment-proofs directory:', proofDir);
}

// Configure multer for payment proof uploads
const paymentProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, proofDir);
  },
  filename: (req, file, cb) => {
    const orderNumber = req.body.orderNumber || 'proof';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${orderNumber}-${timestamp}${ext}`);
  }
});

const paymentProofUpload = multer({
  storage: paymentProofStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    console.log('Validating file:', file.originalname, 'Type:', file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files are allowed');
      console.error('File filter error:', error.message);
      cb(error);
    }
  }
});

// Middleware
app.use(cors());
app.options('*', cors());

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Payment Proof Upload Endpoint
app.post('/api/payment-proof-upload', paymentProofUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      console.error('No file uploaded in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Payment proof uploaded:', req.file.filename);
    const filePath = `/uploads/payment-proofs/${req.file.filename}`;
    res.json({ 
      success: true,
      filePath,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Payment proof upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload payment proof', details: error.message });
  }
});

// Multer error handler for upload endpoint
app.use('/api/payment-proof-upload', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.code, err.message);
    return res.status(400).json({ error: err.message });
  } else if (err) {
    console.error('Upload error:', err.message);
    return res.status(400).json({ error: err.message });
  }
  next();
});

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
    const dbReady = await initializeDatabase();
    
    if (dbReady) {
      console.log('✓ Database initialized successfully');
    } else {
      console.log('\n⚠️  Database schema not found - server starting in compatibility mode');
      console.log('📋 Please create the database schema by opening SCHEMA_CACHE_FIX.html\n');
    }

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
    console.error('\nPlease check:');
    console.error('1. SUPABASE_URL and SUPABASE_KEY are set in backend/.env');
    console.error('2. Your Supabase project is accessible');
    console.error('3. The database schema has been created in Supabase SQL Editor\n');
    process.exit(1);
  }
}

start();
