const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise} MongoDB connection
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    return conn;
  } catch (error) {
    process.exit(1);
  }
};

module.exports = connectDB;