// controllers/sdsmController.js
const SDSMData = require('../models/SDSMData');

/**
 * Get all SDSM data (implicitly from MLK_Central)
 * @route GET /api/sdsm/all
 */
exports.getAllSDSM = async (req, res) => {
  try {
    const { limit = 100, timestamp } = req.query;

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

    console.log(`Found ${data.length} SDSM data points`);

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Error fetching SDSM data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SDSM data',
      error: error.message
    });
  }
};
