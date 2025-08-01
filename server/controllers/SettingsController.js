const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const { uploadFileToDrive } = require('../utils/googleDrive'); // You'll need to implement this

// Get all settings for a service provider
exports.getSettings = async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Get service provider ID from email
        const [authData] = await db.query(
            'SELECT id FROM service_providers_authdata WHERE email = ?', 
            [email]
        );

        if (authData.length === 0) {
            return res.status(404).json({ error: 'Service provider not found' });
        }

        const serviceProviderId = authData[0].id;

        // Get all related data in parallel
        const [profile, aadhaar, portfolio] = await Promise.all([
            db.query('SELECT * FROM service_providers_authdata WHERE id = ?', [serviceProviderId]),
            db.query('SELECT * FROM aadhaar_verifications WHERE service_provider_id = ?', [serviceProviderId]),
            db.query('SELECT * FROM portfolio_verifications WHERE service_provider_id = ?', [serviceProviderId])
        ]);

        const response = {
            profile: profile[0][0] || null,
            aadhaar: aadhaar[0][0] || null,
            portfolio: portfolio[0][0] || null
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update profile settings
exports.updateProfile = async (req, res) => {
    try {
        const { email, full_name, business_name, address, services_offered } = req.body;
        let profile_picture = null;

        if (req.file) {
            // Upload to Google Drive
            const fileId = await uploadFileToDrive(req.file);
            profile_picture = `https://drive.google.com/uc?export=view&id=${fileId}`;
            
            // Delete temporary file
            fs.unlinkSync(req.file.path);
        }

        // Get service provider ID
        const [authData] = await db.query(
            'SELECT id FROM service_providers_authdata WHERE email = ?', 
            [email]
        );

        if (authData.length === 0) {
            return res.status(404).json({ error: 'Service provider not found' });
        }

        const serviceProviderId = authData[0].id;

        // Update profile
        await db.query(
            `UPDATE service_providers_profiles 
             SET full_name = ?, business_name = ?, address = ?, services_offered = ?, 
                 profile_picture = COALESCE(?, profile_picture)
             WHERE service_provider_id = ?`,
            [
                full_name, 
                business_name, 
                address, 
                JSON.stringify(services_offered),
                profile_picture,
                serviceProviderId
            ]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update Aadhaar verification
exports.updateAadhaar = async (req, res) => {
    try {
        const { email, aadhaar_number, phone } = req.body;
        let file_url = null;

        if (req.file) {
            // Upload to Google Drive
            const fileId = await uploadFileToDrive(req.file);
            file_url = `https://drive.google.com/uc?export=view&id=${fileId}`;
            
            // Delete temporary file
            fs.unlinkSync(req.file.path);
        }

        // Get service provider ID
        const [authData] = await db.query(
            'SELECT id FROM service_providers_authdata WHERE email = ?', 
            [email]
        );

        if (authData.length === 0) {
            return res.status(404).json({ error: 'Service provider not found' });
        }

        const serviceProviderId = authData[0].id;

        // Check if record exists
        const [existing] = await db.query(
            'SELECT id FROM aadhaar_verifications WHERE service_provider_id = ?',
            [serviceProviderId]
        );

        if (existing.length > 0) {
            // Update existing
            await db.query(
                `UPDATE aadhaar_verifications 
                 SET aadhaar_number = ?, phone = ?, file_url = COALESCE(?, file_url),
                     verification_status = 'pending'
                 WHERE service_provider_id = ?`,
                [aadhaar_number, phone, file_url, serviceProviderId]
            );
        } else {
            // Insert new
            await db.query(
                `INSERT INTO aadhaar_verifications 
                 (service_provider_id, aadhaar_number, phone, file_url, verification_status)
                 VALUES (?, ?, ?, ?, 'pending')`,
                [serviceProviderId, aadhaar_number, phone, file_url]
            );
        }

        res.json({ message: 'Aadhaar information updated successfully' });
    } catch (error) {
        console.error('Error updating Aadhaar:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update portfolio
exports.updatePortfolio = async (req, res) => {
    try {
        const { 
            email,
            portfolioLinks,
            experienceYears,
            expertiseAreas,
            certifications
        } = req.body;

        // Get service provider ID
        const [authData] = await db.query(
            'SELECT id FROM service_providers_authdata WHERE email = ?', 
            [email]
        );

        if (authData.length === 0) {
            return res.status(404).json({ error: 'Service provider not found' });
        }

        const serviceProviderId = authData[0].id;

        // Handle file uploads
        const uploadPromises = [];
        const fileFields = [
            'portfolioImages',
            'experienceCerts',
            'expertiseProof',
            'certDocuments'
        ];

        const fileUrls = {};
        
        for (const field of fileFields) {
            if (req.files[field]) {
                const file = req.files[field][0];
                uploadPromises.push(
                    uploadFileToDrive(file).then(fileId => {
                        fileUrls[field] = `https://drive.google.com/uc?export=view&id=${fileId}`;
                        fs.unlinkSync(file.path);
                    })
                );
            }
        }

        await Promise.all(uploadPromises);

        // Check if record exists
        const [existing] = await db.query(
            'SELECT id FROM portfolio_verifications WHERE service_provider_id = ?',
            [serviceProviderId]
        );

        if (existing.length > 0) {
            // Update existing
            await db.query(
                `UPDATE portfolio_verifications 
                 SET portfolioLinks = ?, experienceYears = ?, expertiseAreas = ?, 
                     certifications = ?,
                     portfolioImages = COALESCE(?, portfolioImages),
                     experienceCerts = COALESCE(?, experienceCerts),
                     expertiseProof = COALESCE(?, expertiseProof),
                     certDocuments = COALESCE(?, certDocuments),
                     verification_status = 'pending'
                 WHERE service_provider_id = ?`,
                [
                    portfolioLinks,
                    experienceYears,
                    expertiseAreas,
                    certifications,
                    fileUrls.portfolioImages,
                    fileUrls.experienceCerts,
                    fileUrls.expertiseProof,
                    fileUrls.certDocuments,
                    serviceProviderId
                ]
            );
        } else {
            // Insert new
            await db.query(
                `INSERT INTO portfolio_verifications 
                 (service_provider_id, portfolioLinks, experienceYears, expertiseAreas,
                  certifications, portfolioImages, experienceCerts, expertiseProof, certDocuments,
                  verification_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    serviceProviderId,
                    portfolioLinks,
                    experienceYears,
                    expertiseAreas,
                    certifications,
                    fileUrls.portfolioImages,
                    fileUrls.experienceCerts,
                    fileUrls.expertiseProof,
                    fileUrls.certDocuments
                ]
            );
        }

        res.json({ message: 'Portfolio updated successfully' });
    } catch (error) {
        console.error('Error updating portfolio:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update password
exports.updatePassword = async (req, res) => {
    try {
        const { email, currentPassword, newPassword } = req.body;

        // Get service provider
        const [authData] = await db.query(
            'SELECT id, password FROM service_providers_authdata WHERE email = ?', 
            [email]
        );

        if (authData.length === 0) {
            return res.status(404).json({ error: 'Service provider not found' });
        }

        // Verify current password (in a real app, you'd use bcrypt.compare)
        if (authData[0].password !== currentPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update password (in a real app, you'd hash the new password)
        await db.query(
            'UPDATE service_providers_authdata SET password = ? WHERE id = ?',
            [newPassword, authData[0].id]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};