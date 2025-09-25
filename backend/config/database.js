const mongoose = require('mongoose');
//pushing through the mongoose

const connectDB = async () => {
  try {
    // Try to get from environment, fallback to default
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/accessly';
    
    console.log('Using MongoDB URI:', mongoURI);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;