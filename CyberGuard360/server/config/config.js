import dotenv from 'dotenv';

dotenv.config();

export default {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberguard360',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  VIRUSTOTAL_API_KEY: process.env.VIRUSTOTAL_API_KEY,
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || '15m',
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100
};