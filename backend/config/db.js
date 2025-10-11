const mongoose = require('mongoose');

const connectDB = async (mongoUri) => {
  try {
    if (!mongoUri) throw new Error('MONGO_URI not provided!');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // stop server if DB fails
  }
};

module.exports = connectDB;//
