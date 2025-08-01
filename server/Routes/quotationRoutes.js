const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { submitQuotation } = require('../controllers/quotationController');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/submit-quotation', upload.single('quotationFile'), submitQuotation);

module.exports = router;
