const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController.js')
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, analyticsController.getAnalytics);

module.exports = router;