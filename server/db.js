const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/habitforge';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.warn('MongoDB not available, using users.json file:', error.message);
    return false;
  }
};

module.exports = connectDB;
