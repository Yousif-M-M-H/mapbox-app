const express = require('express');
const router = express.Router();

const mapRoutes = require('./mapRoutes');
// Include other route modules here

// Mount all routes
router.use('/api/maps', mapRoutes);
// router.use('/api/other-endpoint', otherRoutes);

module.exports = router;