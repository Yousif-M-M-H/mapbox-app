// mongodb-server/controllers/sdsmController.js
const SDSMData = require('../models/SDSMData'); // Add this import

exports.getAllSDSM = async (req, res) => {
  try {
    const { limit = 100, timestamp } = req.query;

    // Log SDSM data fetch request for monitoring API usage and debugging query parameters
    console.log(`Fetching all SDSM data`);

    const query = {};

    // Add timestamp filter if provided
    if (timestamp) {
      if (timestamp.includes(',')) {
        const [startTime, endTime] = timestamp.split(',');
        query.timestamp = {
          $gte: new Date(startTime),
          $lte: new Date(endTime)
        };
      } else {
        query.timestamp = { $gte: new Date(timestamp) };
      }
    }

    const data = await SDSMData.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    // Log count of SDSM data points retrieved to verify query results and data availability
    console.log(`Found ${data.length} SDSM data points`);

    // Transform the data to ensure correct coordinate format
    const transformedData = data.map(item => {
      // Check if coordinates exist and are in the reversed format
      if (item.location && 
          Array.isArray(item.location.coordinates) && 
          item.location.coordinates.length === 2) {
        
        // Create a new object with the same structure but swapped coordinates
        return {
          ...item,
          location: {
            ...item.location,
            // Swap the coordinates to ensure [longitude, latitude] format for GeoJSON
            coordinates: [item.location.coordinates[1], item.location.coordinates[0]]
          }
        };
      }
      
      // If no coordinates or wrong format, return item unchanged
      return item;
    });

    res.json({
      success: true,
      count: transformedData.length,
      data: transformedData
    });
  } catch (error) {
    // Log SDSM data fetch errors for troubleshooting database or query issues
    console.error('Error fetching SDSM data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SDSM data',
      error: error.message
    });
  }
};