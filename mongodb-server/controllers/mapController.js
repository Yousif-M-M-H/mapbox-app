const MapEvent = require('../models/MapEvent');

/**
 * Get all map events with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllMapEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    
    const mapEvents = await MapEvent.find({})
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 })
      .lean();

    const total = await MapEvent.countDocuments();

    if (!mapEvents || mapEvents.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No map events found' 
      });
    }

    return res.status(200).json({
      success: true,
      count: mapEvents.length,
      totalDocuments: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: mapEvents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get map events by intersection ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMapEventsByIntersection = async (req, res) => {
  try {
    const intersectionId = parseInt(req.params.id);
    
    if (isNaN(intersectionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid intersection ID format'
      });
    }
    
    const mapEvents = await MapEvent.find({ intersectionId })
      .sort({ laneId: 1 })
      .lean();
      
    if (mapEvents.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No map events found for intersection ID ${intersectionId}`
      });
    }
    
    return res.status(200).json({
      success: true,
      count: mapEvents.length,
      data: mapEvents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get map events within geographic bounds
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMapEventsByBounds = async (req, res) => {
  try {
    const { minLng, minLat, maxLng, maxLat } = req.query;
    
    if (!minLng || !minLat || !maxLng || !maxLat) {
      return res.status(400).json({
        success: false,
        message: 'Missing required bounds parameters (minLng, minLat, maxLng, maxLat)'
      });
    }
    
    const bounds = {
      minLng: parseFloat(minLng),
      minLat: parseFloat(minLat),
      maxLng: parseFloat(maxLng),
      maxLat: parseFloat(maxLat)
    };
    
    for (const [key, value] of Object.entries(bounds)) {
      if (isNaN(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${key} parameter: must be a valid number`
        });
      }
    }
    
    const mapEvents = await MapEvent.find({
      'location': {
        $geoWithin: {
          $box: [
            [bounds.minLng, bounds.minLat],
            [bounds.maxLng, bounds.maxLat]
          ]
        }
      }
    }).lean();
    
    return res.status(200).json({
      success: true,
      count: mapEvents.length,
      bounds: bounds,
      data: mapEvents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get visualization-optimized map events by intersection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getVisualizationData = async (req, res) => {
  try {
    const intersectionId = parseInt(req.params.id);
    
    if (isNaN(intersectionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid intersection ID format'
      });
    }
    
    const mapEvents = await MapEvent.find({ intersectionId }).lean();
    
    if (mapEvents.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No map events found for intersection ID ${intersectionId}`
      });
    }
    
    const visualizationData = mapEvents.map(event => ({
      id: event._id,
      laneId: event.laneId,
      path: event.location.coordinates.map(coord => [coord[1], coord[0]]),
      isVehicleLane: event.laneAttributes.laneType[0] === 'vehicle',
      directionalUse: event.laneAttributes.directionalUse,
      width: event.laneAttributes.sharedWidth[1] || 0,
      connectsTo: event.connectsTo,
      intersectionName: event.intersectionName
    }));
    
    return res.status(200).json({
      success: true,
      intersectionName: mapEvents[0].intersectionName,
      count: visualizationData.length,
      data: visualizationData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


