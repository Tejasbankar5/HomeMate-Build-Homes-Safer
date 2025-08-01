const express = require('express');
const router = express.Router();
const DynamicController = require('../controllers/DynamicController');
// Profile routes
router.get('/profile', DynamicController.getProfile);
router.get('/verification', DynamicController.getVerificationStatus);
router.get('/portfolio', DynamicController.getPortfolioData);
router.get('/requests', DynamicController.getServiceRequests);

module.exports = router;