const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
// const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const questionRoutes = require('./routes/questionRoutes');
const quizRoutes = require('./routes/quizRoutes');
const adminRoutes = require('./routes/adminRoutes');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Sirf GET requests cache karein
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      console.log(`✅ Cache HIT: ${key}`);
      return res.json(cachedResponse);
    }
    
    // Store original send method
    const originalSend = res.json;
    res.json = function(data) {
      console.log(`📦 Cache SET: ${key}`);
      cache.set(key, data, duration);
      originalSend.call(this, data);
    };
    next();
  };
};
// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL injection
// app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/quiz', limiter);
// Sirf root route ke liye
app.get('/', (req, res) => {
  res.json({
    message: '🎯 Quiz System API is live!',
    endpoints: {
      health: '/api/health',
      quizzes: '/api/quizzes',
      auth: '/api/auth'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Quiz API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;