const db = require('../config/db');
const { uploadToDrive } = require('../utils/googleDrive');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Helper function to handle file uploads
async function handleFileUpload(file, folderName) {
  if (!file) return null;
  
  const tempPath = file.path;
  const fileExtension = path.extname(file.originalname);
  const fileName = `${folderName}/${uuidv4()}${fileExtension}`;
  
  try {
    const fileUrl = await uploadToDrive(tempPath, fileName, file.mimetype);
    return fileUrl;
  } catch (error) {
    console.error(`Error uploading ${folderName}:`, error);
    throw error;
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

exports.submitPortfolioVerification = async (req, res) => {
  try {
    const { email, portfolioLinks, experienceYears, expertiseAreas, certifications } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Get service provider ID
    const [provider] = await db.query(
      'SELECT id FROM service_providers_authdata WHERE email = ?', 
      [email]
    );

    if (!provider.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Process file uploads
    const files = {};
    for (const [field, fileArray] of Object.entries(req.files)) {
      if (fileArray && fileArray[0]) {
        files[field] = await handleFileUpload(fileArray[0], field);
      }
    }

    // Insert into database
    const [result] = await db.query(
      `INSERT INTO portfolio_verifications 
      (service_provider_id, portfolioLinks, experienceYears, expertiseAreas, certifications, portfolioImages, experienceCerts, expertiseProof, certDocuments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        provider[0].id,
        portfolioLinks,
        experienceYears,
        expertiseAreas,
        certifications,
        files.portfolioImages || null,
        files.experienceCerts || null,
        files.expertiseProof || null,
        files.certDocuments || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Portfolio submitted successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};
  
  // Fetch portfolios by service provider
  exports.getPortfolioVerificationsByProvider = async (req, res) => {
    const { service_provider_id } = req.params;
  
    try {
      const [results] = await db.query(
        'SELECT * FROM portfolio_verifications WHERE service_provider_id = ? ORDER BY submitted_at DESC',
        [service_provider_id]
      );
      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error fetching portfolio verifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch portfolio verifications',
        error: error.message
      });
    }
  };

  
exports.getPortfolioVerifications = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM portfolio_verifications ORDER BY submitted_at DESC');
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching portfolio verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio verifications',
      error: error.message
    });
  }
};
