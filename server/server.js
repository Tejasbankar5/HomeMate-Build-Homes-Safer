const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const serviceProviderRoutes = require('./Routes/serviceProviderRoutes');
const otpRoutes = require("./Routes/OtpRoutes");
const aadhaarRoutes = require("./Routes/adhaarRoutes"); // 🔹 Fixed path issue
const app = express();
const path = require("path");
const portfolioVerificationRoutes = require('./Routes/PortfolioRoutes');
const profileRoutes = require("./Routes/profileRoutes");
const PORT = process.env.PORT || 7000;
const portfolioRoutes = require("./Routes/PortfolioRoutes");
console.log("🚀 [Server] Starting server...");
// Add this with your other route imports
const serviceProviderRequests = require('./Routes/ServiceProviderRequests');
const viewProfileRoutes=require('./Routes/viewProfileRoute')
const earningRoutes = require('./Routes/earningsRoutes')
// Add this with your other app.use() routes
app.use('/api/service-requests', serviceProviderRequests);
// Import routes
const helmet = require('helmet');  
const cookieParser=require('cookie-parser');// Add this line at the top with other requires
const DynamicRoutes=require("./Routes/DynamicRoute")
const Construction=require('./Routes/constructionRoutes');
const Notification=require('./Routes/Notification');
const Emailrequest=require('./Routes/requestidemailRoutes');
const quotation=require('./Routes/quotationRoutes');
const Settings=require('./Routes/settingsRoutes');
const acontractsRoutes=require('./Routes/acontractsRoutes');
// CORS Configuration
app.use(
  cors({
    origin: "http://localhost:5174", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use('/api/dynamic', DynamicRoutes);
// Middleware
app.use(helmet());
app.use(cookieParser()); // Parse cookies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Load Routes
console.log("✅ [Routes] Loading service provider routes...");
app.use("/", serviceProviderRoutes);

console.log("✅ [Routes] Loading OTP routes...");
app.use("/api/otp", otpRoutes);
app.use("/api/aadhaar", aadhaarRoutes); // Aadhaar Upload Route
// ✅ Serve Uploaded Files (Temporary)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/api/portfolio', portfolioVerificationRoutes);
// ✅ Routes
// Use routes
app.use('/api/profiles', viewProfileRoutes);

app.use('/api/service-requests', serviceProviderRequests);
app.use("/api/port", portfolioRoutes);
app.use("/api/", profileRoutes);
app.use("/api",earningRoutes);
// Start Server
app.use('/api/construction', Construction);
app.use('/api',Notification);
app.use('/api',Emailrequest);
app.use('/api',quotation);
app.use('/api/settings',Settings);
app.use('/api',acontractsRoutes);
app.listen(PORT, () => {
  console.log(`✅ [Server] Running on port ${PORT}`);
});
