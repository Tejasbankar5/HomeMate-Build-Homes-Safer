const express = require('express');
const router = express.Router();
const {
  getConstructionRequests,
  acceptConstructionRequest,
  getContractDocument
} = require('../controllers/constructionController');

// Middleware to verify provider authentication
const verifyProvider = (req, res, next) => {
  // Implement your authentication logic here
  // For example, check JWT token or session
  next();
};

// Get Nagpur construction requests
router.get('/requests', verifyProvider, getConstructionRequests);

// Accept a construction request
router.post('/accept-request', verifyProvider, acceptConstructionRequest);
router.get('/contractdocument/:requestId', verifyProvider, getContractDocument);

module.exports = router;