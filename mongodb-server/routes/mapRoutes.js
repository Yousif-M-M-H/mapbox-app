const express = require('express');
const router = express.Router();
const MapEvent = require('../models/MapEvent');

/**
 * @route   GET /api/maps/all
 * @desc    Get all map events with pagination
 * @access  Public
 */
router.get('/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    
    // Query map events with pagination
    const mapEvents = await MapEvent.find({})
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 })
      .lean();

    // Get total count for pagination info
    const total = await MapEvent.countDocuments();

    if (!mapEvents || mapEvents.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No map events found' 
      });
    }

    // Return success with map events data and pagination info
    return res.status(200).json({
      success: true,
      count: mapEvents.length,
      totalDocuments: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: mapEvents
    });
  } catch (error) {
    console.error('Error fetching map events:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;