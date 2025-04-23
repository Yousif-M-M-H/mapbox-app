const mongoose = require('mongoose');

/**
 * Map Event Schema
 * Represents lane and intersection data for map visualization
 */
const mapEventSchema = new mongoose.Schema({
  connectsTo: [mongoose.Schema.Types.ObjectId],
  laneId: {
    type: Number,
    required: true
  },
  laneAttributes: {
    directionalUse: [Number],
    laneType: mongoose.Schema.Types.Mixed, // To handle the nested array with mixed types
    sharedWidth: [Number]
  },
  intersectionId: {
    type: Number,
    required: true,
    index: true
  },
  location: {
    coordinates: [[Number]],
    type: {
      type: String,
      enum: ['LineString'],
      default: 'LineString'
    }
  },
  intersectionName: String,
  maneuvers: [String],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { 
  collection: 'map_events'
});

// Create geospatial index for location-based queries
mapEventSchema.index({ 'location': '2dsphere' });

const MapEvent = mongoose.model('MapEvent', mapEventSchema);

module.exports = MapEvent;