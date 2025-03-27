// simple-server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Apply CORS middleware
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    return false;
  }
};

// Root endpoint for testing
app.get('/', (req, res) => {
  res.send('MongoDB Server is running. Use /api/status to check connection.');
});

// Connection status endpoint
app.get('/api/status', async (req, res) => {
  console.log('Status endpoint called from:', req.ip);
  const isConnected = mongoose.connection.readyState === 1;
  console.log('MongoDB connection readyState:', mongoose.connection.readyState);
  
  const response = { 
    connected: isConnected,
    message: isConnected ? 'Connected to MongoDB!' : 'Not connected to MongoDB'
  };
  
  console.log('Sending response:', response);
  res.json(response);
});

// Start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  // Listen on all network interfaces (important for external access)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Available at http://localhost:${PORT}/`);
    console.log(`Status endpoint: http://localhost:${PORT}/api/status`);
    console.log('\nYour server is now accessible on your local network');
  });
});