const express = require('express');
const router = express.Router();
const contractsController = require('../controllers/AcceptedContractsController');

// Get all accepted contracts for a provider
router.post('/accepted', contractsController.getAcceptedContracts);

// Generate digital contract
router.post('/generate', contractsController.generateDigitalContract);

// Download contract
router.get('/contracts/download/:filename', contractsController.downloadContract);

module.exports = router;