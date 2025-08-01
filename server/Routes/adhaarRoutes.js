// routes/adhaarRoutes.js
const express = require("express");
const multer = require("multer");
const { uploadAadhaar } = require("../controllers/adhaarController"); // ✅ Ensure correct import

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Multer for handling file uploads

// ✅ Define the route correctly
router.post("/upload", upload.single("aadhaarFile"), uploadAadhaar);

module.exports = router;
