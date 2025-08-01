const express = require('express');
const router = express.Router();
const { getRequestIdByEmail } = require('../controllers/getRequestIdbyemail');

router.get('/requests/:email', getRequestIdByEmail);

module.exports = router;
