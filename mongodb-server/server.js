require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Routes import (remove sdsmRoutes)
const mapRoutes = require('./routes/mapRoutes');
// const sdsmRoutes = require('./routes/sdsmRoutes'); // Remove this line

// Initialize Express app
const app = express();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/map_visualization');
  } catch (error) {
    process.exit(1);
  }
};

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes (remove sdsmRoutes)
// app.use('/api/sdsm', sdsmRoutes); // Remove this line
app.use('/api/maps', mapRoutes); // Keep this line if you still need map data

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
});

module.exports = app;