const axios = require("axios");


// ✅ Send OTP
exports.sendOtp = async (req, res) => {
  const { phone } = req.body;
  console.log("📩 [OTP Request] Received request for phone:", phone);

  if (!phone || phone.length !== 10) {
    console.log("❌ [OTP Request] Invalid phone number:", phone);
    return res.status(400).json({ error: "Invalid phone number" });
  }

  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${API_KEY}/SMS/${phone}/AUTOGEN/${TEMPLATE_NAME}`
    );

    console.log("✅ [OTP Sent] Response from 2Factor:", response.data);

    if (response.data.Status === "Success") {
      return res.status(200).json({ sessionId: response.data.Details }); // Send sessionId to frontend
    } else {
      return res.status(400).json({ error: "OTP request failed", details: response.data });
    }
  } catch (error) {
    console.log("❌ [OTP Send Error]", error.response?.data || error.message);
    return res.status(500).json({ 
      error: "Failed to send OTP",
      details: error.response?.data || error.message 
    });
  }
};

// ✅ Verify OTP
exports.verifyOtp = async (req, res) => {
  const { sessionId, otp } = req.body;
  console.log("🔍 [OTP Verification] Received request:", req.body);

  if (!sessionId || !otp) {
    console.log("❌ [OTP Verification] Missing sessionId or OTP");
    return res.status(400).json({ error: "Session ID and OTP are required" });
  }

  try {
    const response = await axios.get(
      `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`
    );

    console.log("✅ [OTP Verified] Response from 2Factor:", response.data);

    if (response.data.Status === "Success") {
      return res.status(200).json({ message: "OTP verified successfully!" });
    } else {
      return res.status(400).json({ error: "Invalid OTP", details: response.data });
    }
  } catch (error) {
    console.log("❌ [OTP Verification Error]", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({ 
      error: "OTP verification failed", 
      details: error.response?.data || error.message 
    });
  }
};
