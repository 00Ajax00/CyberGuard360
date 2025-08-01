import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import scanRoutes from './routes/scan.js';
import reportRoutes from './routes/report.js';
import historyRoutes from './routes/history.js';

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection Setup
mongoose.set('strictQuery', false); // Remove deprecation warning

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority'
    });
    console.log(' MongoDB Connected');
  } catch (error) {
    console.error(' MongoDB Connection Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify MONGODB_URI in .env matches Atlas connection string');
    console.log('2. Check IP whitelist in MongoDB Atlas → Network Access');
    console.log('3. Confirm database user has read/write permissions');
    process.exit(1);
  }
};

// ... (after all your other routes)

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'CyberGuard360 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      scan: '/api/scan',
      report: '/api/report',
      history: '/api/history'
    },
    docs: 'https://github.com/yourusername/CyberGuard360/docs'
  });
});

// Error Handling (keep this last)
app.use((err, req, res, next) => {
  console.error('⚠️ Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error'
  });
});

// Middleware
app.set('trust proxy', 1); // Required for rate limiting behind proxies
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*'
}));
app.use(express.json());

// Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/history', historyRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error('⚠️ Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database: ${mongoose.connection.host}/${mongoose.connection.name}`);
    });
  } catch (error) {
    console.error('❌ Server Startup Failed:', error);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM Received - Shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB Connection Closed');
    process.exit(0);
  });
});