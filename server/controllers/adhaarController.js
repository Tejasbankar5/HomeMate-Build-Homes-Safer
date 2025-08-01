const fs = require("fs");
const db = require("../config/db");
const { uploadToDrive } = require("../utils/googleDrive");

const uploadAadhaar = async (req, res) => {
  try {
    console.log("📥 Received Aadhaar Upload Request...");
    console.log("🔍 Request File:", req.file);
    console.log("🔍 Request Body:", req.body);

    // Extract fields from form data
    const { email, aadhaarNumber, phone } = req.body;

    if (!req.file) {
      console.error("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("📂 Uploaded File Info:", req.file);

    if (!email || !aadhaarNumber || !phone) {
      console.error("❌ Missing required fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Ensure file path exists before uploading
    if (!fs.existsSync(req.file.path)) {
      console.error("❌ File does not exist on server:", req.file.path);
      return res.status(500).json({ error: "File not found on server" });
    }

    console.log("🚀 Uploading file to Google Drive...");
    
    // ✅ Upload to Google Drive
    const driveUrl = await uploadToDrive(req.file.path, req.file.filename, req.file.mimetype);

    console.log("✅ File uploaded to Google Drive:", driveUrl);

    // ✅ Retrieve service_provider_id from service_providers_authdata table using email
    const [rows] = await db.execute(
      "SELECT id FROM service_providers_authdata WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      console.error("❌ No service provider found with the given email.");
      return res.status(400).json({ error: "No service provider found with the given email." });
    }

    const serviceProviderId = rows[0].id; // ✅ Fixed issue here
    console.log("✅ Retrieved service_provider_id:", serviceProviderId);

    // ✅ Insert into MySQL (aadhaar_verifications table)
    const sql = `INSERT INTO aadhaar_verifications (service_provider_id, aadhaar_number, phone, file_url) VALUES (?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [serviceProviderId, aadhaarNumber, phone, driveUrl]);

    console.log("✅ MySQL Insert Result:", result);

    // ✅ Delete local file after successful upload
    fs.unlinkSync(req.file.path);
    console.log("🗑️ Local file deleted:", req.file.path);

    res.status(201).json({ message: "Aadhaar uploaded successfully!", fileUrl: driveUrl });
  }  catch (error) {
    console.error("❌ [Upload Aadhaar Error]", error);
    res.status(500).json({ 
      error: "Server error, please try again.", 
      details: error.message 
    });
  }
};
module.exports = { uploadAadhaar };
