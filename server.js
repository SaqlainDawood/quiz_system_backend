require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const seedDatabase = require('./src/utils/seedData');

const PORT = process.env.PORT || 5000;
console.log("Mongo URI:", process.env.MONGODB_URI);
// Connect to MongoDB
connectDB();

// Seed database with initial data
seedDatabase();

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Quiz API is ready`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});