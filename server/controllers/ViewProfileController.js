// Backend (profileController.js)
const db = require('../config/db');

exports.getProfileByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }

    const [provider] = await db.query(
      `SELECT sp.id, sp.email, sp.phone_number, sp.created_at,
       spp.full_name, spp.business_name, spp.address, spp.profile_picture, spp.services_offered
       FROM service_providers_authdata sp
       LEFT JOIN service_provider_profiles spp ON sp.id = spp.service_provider_id
       WHERE sp.email = ?`, 
      [email]
    );

    if (!provider || provider.length === 0) {
      return res.status(404).json({ message: 'Service provider not found' });
    }

    const providerId = provider[0].id;
    const [aadhaarVerification] = await db.query(
      'SELECT aadhaar_number, file_url FROM aadhaar_verifications WHERE service_provider_id = ?', 
      [providerId]
    );

    // Process Google Drive URL to ensure direct image access
    const processDriveUrl = (url) => {
      if (!url) return null;
      const fileId = url.match(/[-\w]{25,}/)?.[0];
      return fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : url;
    };

    res.json({
      ...provider[0],
      profile_picture: processDriveUrl(provider[0].profile_picture),
      aadhaar_verification: aadhaarVerification.length > 0 ? {
        ...aadhaarVerification[0],
        file_url: processDriveUrl(aadhaarVerification[0].file_url)
      } : null
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Server error while fetching profile',
      error: error.message 
    });
  }
};