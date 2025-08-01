const db = require("../config/db");
const { uploadToDrive } = require("../utils/googleDrive");
const path = require("path");
const fs = require("fs");

const createServiceProviderProfile = async (req, res) => {
  try {
    // Log incoming request data for debugging
    console.log("Request body:", req.body);
    console.log("File received:", req.file ? true : false);

    // Extract form data
    const { email, full_name, business_name, address, service_offered } = req.body;

    // Note: Changed services_offered to service_offered to match frontend

    // Validate required fields
    if (!email || !full_name || !address || !service_offered) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        details: {
          email: !email,
          full_name: !full_name,
          address: !address,
          service_offered: !service_offered
        }
      });
    }

    // Check if user exists
    const [provider] = await db.query(
      "SELECT id FROM service_providers_authdata WHERE email = ?",
      [email]
    );

    if (!provider || provider.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Service provider not found. Please register first."
      });
    }

    const service_provider_id = provider[0].id;

    // Check for existing profile
    const [existingProfile] = await db.query(
      "SELECT id FROM service_provider_profiles WHERE service_provider_id = ?",
      [service_provider_id]
    );

    if (existingProfile && existingProfile.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Profile already exists for this user",
        profile_id: existingProfile[0].id
      });
    }

    // Handle file upload if present
    let profile_picture_url = null;
    if (req.file) {
      try {
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `profile_${service_provider_id}_${Date.now()}${fileExtension}`;
        const filePath = req.file.path;

        const driveResponse = await uploadToDrive(filePath, fileName);
        profile_picture_url = driveResponse.webViewLink || driveResponse.webContentLink;

        // Clean up local file
        fs.unlinkSync(filePath);
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload profile picture"
        });
      }
    }

    // Create services_offered JSON (note the field name matches frontend)
    const servicesOfferedJSON = JSON.stringify([
      {
        type: service_offered,
        expertise: "Intermediate"
      }
    ]);

    // Create profile in database
    const [result] = await db.query(
      `INSERT INTO service_provider_profiles (
        service_provider_id,
        full_name,
        business_name,
        address,
        services_offered,
        profile_picture,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        service_provider_id,
        full_name,
        business_name || null,
        address,
        servicesOfferedJSON,
        profile_picture_url
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      profile_id: result.insertId,
      profile_picture_url
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};

module.exports = {
  createServiceProviderProfile
};