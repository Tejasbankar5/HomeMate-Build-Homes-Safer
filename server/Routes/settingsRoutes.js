const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/SettingsController');
const multer = require('multer');
const path = require('path');

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// GET /api/settings - Get user settings
router.get('/', settingsController.getSettings);

// PUT /api/settings/profile - Update profile
router.put('/profile', upload.single('profile_picture'), settingsController.updateProfile);

// PUT /api/settings/aadhaar - Update Aadhaar
router.put('/aadhaar', upload.single('aadhaar_file'), settingsController.updateAadhaar);

// PUT /api/settings/portfolio - Update portfolio
router.put('/portfolio', 
    upload.fields([
        { name: 'portfolioImages', maxCount: 1 },
        { name: 'experienceCerts', maxCount: 1 },
        { name: 'expertiseProof', maxCount: 1 },
        { name: 'certDocuments', maxCount: 1 }
    ]), 
    settingsController.updatePortfolio
);

// PUT /api/settings/password - Update password
router.put('/password', settingsController.updatePassword);

module.exports = router;