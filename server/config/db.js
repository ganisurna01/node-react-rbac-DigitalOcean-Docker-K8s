const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check your internet connection');
    console.error('2. Verify MongoDB Atlas IP whitelist (add 0.0.0.0/0 to allow all IPs for testing)');
    console.error('3. Verify your MongoDB connection string in .env file');
    console.error('4. Check if MongoDB Atlas cluster is running');
    process.exit(1);
  }
};

module.exports = connectDB;

