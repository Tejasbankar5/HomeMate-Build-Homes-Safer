// Routes/serviceProviderRoutes.js
const express = require('express');
const router = express.Router();

const {
  registerServiceProvider,
  loginServiceProvider // ✅ You forgot this line
} = require('../controllers/serviceProviderController');

router.post('/register', registerServiceProvider);
router.post('/login', loginServiceProvider); // ✅ Now this works

module.exports = router;
