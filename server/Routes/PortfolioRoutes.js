const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/PortfolioVerificationController');
const multer = require('multer');
const path = require('path');

// Enhanced file upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../temp-uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow all image types, PDFs, and common document formats
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images (JPEG, PNG, GIF, WEBP), PDFs, and Word documents are allowed.`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

router.post('/submit', 
  upload.fields([
    { name: 'portfolioImages', maxCount: 1 },
    { name: 'experienceCerts', maxCount: 1 },
    { name: 'expertiseProof', maxCount: 1 },
    { name: 'certDocuments', maxCount: 1 }
  ]),
  portfolioController.submitPortfolioVerification
);

module.exports = router;