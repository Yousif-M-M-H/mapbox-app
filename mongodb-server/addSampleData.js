// addSampleData.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import the GeoPoint model
const GeoPoint = require('./models/GeoPoint');

// Sample data - points around Chattanooga, TN
const samplePoints = [
  {
    name: "Tennessee Aquarium",
    description: "A large freshwater aquarium in Chattanooga",
    location: {
      type: "Point",
      coordinates: [-85.310756, 35.055456]
    },
    category: "attraction",
    properties: new Map([
      ["rating", 4.7],
      ["price", "$$"]
    ])
  },
  {
    name: "Lookout Mountain",
    description: "Famous mountain with views of Chattanooga",
    location: {
      type: "Point",
      coordinates: [-85.353229, 35.007542]
    },
    category: "attraction",
    properties: new Map([
      ["rating", 4.8],
      ["hiking", true]
    ])
  },
  {
    name: "The Read House Hotel",
    description: "Historic hotel in downtown Chattanooga",
    location: {
      type: "Point",
      coordinates: [-85.307532, 35.049766]
    },
    category: "hotel",
    properties: new Map([
      ["rating", 4.5],
      ["price", "$$$"]
    ])
  },
  {
    name: "Taco Mamacita",
    description: "Popular taco restaurant in Chattanooga",
    location: {
      type: "Point",
      coordinates: [-85.301943, 35.042978]
    },
    category: "restaurant",
    properties: new Map([
      ["rating", 4.6],
      ["price", "$$"]
    ])
  },
  {
    name: "Walnut Street Bridge",
    description: "Historic pedestrian bridge in Chattanooga",
    location: {
      type: "Point",
      coordinates: [-85.306559, 35.057102]
    },
    category: "attraction",
    properties: new Map([
      ["rating", 4.9],
      ["length", "2,376 feet"]
    ])
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
    
    // Clear existing points (optional)
    await GeoPoint.deleteMany({});
    console.log('Cleared existing points');
    
    // Insert sample points
    const result = await GeoPoint.insertMany(samplePoints);
    console.log(`Added ${result.length} sample points to the database`);
    
    // Disconnect
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Run the function
connectDB();