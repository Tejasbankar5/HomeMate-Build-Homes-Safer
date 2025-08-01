const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');

router.post('/earnings', earningsController.getServiceProviderEarnings);

module.exports = router;