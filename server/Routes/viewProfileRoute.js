const express = require('express');
const router = express.Router();
const profileController = require('../controllers/ViewProfileController');

// Get profile by email
router.get('/by-email', profileController.getProfileByEmail);

module.exports = router;