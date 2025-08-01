const express = require('express');
const router = express.Router();
const ServiceProviderRequests = require('../controllers/ServiceRequestController');
const authenticate = require('../middleware/authenticate');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all service requests
router.get('/', ServiceProviderRequests.getServiceRequests);

// Accept a service request
router.post('/accept', ServiceProviderRequests.acceptServiceRequest);

module.exports = router;