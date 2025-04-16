// routes/sdsmRoutes.js
const express = require('express');
const router = express.Router();
const sdsmController = require('../controllers/sdsmController');

router.get('/all', sdsmController.getAllSDSM);
module.exports = router;
