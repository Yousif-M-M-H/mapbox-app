// models/SDSMData.js
const mongoose = require('mongoose');

const SDSMDataSchema = new mongoose.Schema({
  size: {
    width: Number,
    length: Number
  },
  heading: Number,
  intersection: String,
  intersectionID: String,
  location: {
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    type: {
      type: String,
      default: 'Point'
    }
  },
  type: String,
  objectID: Number,
  speed: Number,
  timestamp: Date
}, {
  collection: 'sdsm_events',
  strict: false
});

SDSMDataSchema.index({ intersection: 1 });
SDSMDataSchema.index({ timestamp: 1 });
SDSMDataSchema.index({ objectID: 1 });

const SDSMData = mongoose.models.SDSMData || mongoose.model('SDSMData', SDSMDataSchema);

module.exports = SDSMData;