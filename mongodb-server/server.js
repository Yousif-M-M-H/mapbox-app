// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Import routes
const sdsmRoutes = require('./routes/sdsmRoutes');

// Apply middleware
app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    // Use the provided connection string for the CV2X data
    const MONGO_URI = process.env.MONGO_URI || "mongodb://readonly_user:readonly_pass@10.199.1.25:27017/cv2x_data";
    
    const conn = await mongoose.connect(MONGO_URI, {
      // For MongoDB 6.0+, these options aren't needed but included for compatibility
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    return false;
  }
};

// Root endpoint for testing
app.get('/', (req, res) => {
  res.send('CV2X API Server is running - MongoDB Connected');
});

// API status endpoint
app.get('/api/status', async (req, res) => {
  console.log('Status endpoint called from:', req.ip);
  const isConnected = mongoose.connection.readyState === 1;
  
  const response = { 
    connected: isConnected,
    message: isConnected ? 'Connected to MongoDB CV2X data!' : 'Not connected to MongoDB',
    server: 'Express server is running',
    version: '1.0.0'
  };
  
  console.log('Sending response:', response);
  res.json(response);
});

// Mount the SDSM routes
app.use('/api/sdsm', sdsmRoutes);

// Start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  // Listen on all network interfaces
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server is accessible at http://localhost:${PORT}/`);
    console.log(`Status endpoint: http://localhost:${PORT}/api/status`);
    console.log(`SDSM endpoints: http://localhost:${PORT}/api/sdsm/`);
  });
});