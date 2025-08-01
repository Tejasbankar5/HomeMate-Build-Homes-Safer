const express = require("express");
const router = express.Router();
const otpController = require("../controllers/OtpController");

console.log("✅ [Routes] OTP Routes Loaded");

// ✅ Route to send OTP
router.post("/send-otp", otpController.sendOtp);

// ✅ Route to verify OTP
router.post("/verify-otp", otpController.verifyOtp);

module.exports = router;
