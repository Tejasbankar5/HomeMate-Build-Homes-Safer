const db = require('../config/db');

exports.registerServiceProvider = async (req, res) => {
  console.log("👉 Received request to /api/register");

  try {
    const { email, phone_number, password } = req.body;

    console.log("📝 Request Body:", req.body);

    // Validate input
    if (!email || !phone_number || !password) {
      console.log("❌ Missing fields");
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if email already exists
    const [existing] = await db.query(
      'SELECT * FROM service_providers_authdata WHERE email = ?',
      [email]
    );

    console.log("🔍 Existing user query result:", existing);

    if (existing.length > 0) {
      console.log("⚠️ Email already registered:", email);
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Insert the new service provider
    const insertQuery = 'INSERT INTO service_providers_authdata (email, phone_number, password) VALUES (?, ?, ?)';
    console.log("📤 Inserting with query:", insertQuery);
    console.log("📤 Values:", [email, phone_number, password]);

    const [insertResult] = await db.query(insertQuery, [email, phone_number, password]);

    console.log("✅ Insert success:", insertResult);

    return res.status(201).json({ message: 'Registration successful!' });
  } catch (err) {
    console.error("🔥 Server error in registration:", err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};


exports.loginServiceProvider = async (req, res) => {
  console.log("👉 Login request received");

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing login fields");
      return res.status(400).json({ message: "Email and password required." });
    }

    const [result] = await db.query(
      "SELECT * FROM service_providers_authdata WHERE email = ? AND password = ?",
      [email, password]
    );

    console.log("🔍 Login query result:", result);

    if (result.length === 0) {
      console.log("❌ Invalid credentials for", email);
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // For now, we skip JWT/token auth
    return res.status(200).json({ message: "Login successful!" });
  } catch (err) {
    console.error("🔥 Login error:", err);
    return res.status(500).json({ message: "Server error during login." });
  }
};
