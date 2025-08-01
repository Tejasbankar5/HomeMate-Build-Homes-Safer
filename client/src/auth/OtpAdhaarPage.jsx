import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import "./otp.css";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AadhaarOtpVerification = () => {
  const [aadhaar, setAadhaar] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(45);
  const [verified, setVerified] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Enhanced email verification
  useEffect(() => {
    const getStoredEmail = () => {
      try {
        // Try localStorage first
        let userEmail = localStorage.getItem("email");
        
        // If not found in localStorage, try cookies
        if (!userEmail) {
          userEmail = Cookies.get("email");
        }
        
        // If still not found, redirect to register
        if (!userEmail) {
          throw new Error("No email found in storage");
        }
        
        // Clean and validate the email
        userEmail = userEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
          throw new Error("Invalid email format");
        }
        
        return userEmail;
      } catch (error) {
        console.error("Email retrieval error:", error);
        toast.error("Session expired. Please register again.");
        navigate("/register");
        return null;
      }
    };

    const verifyEmailAndLoad = async () => {
      const userEmail = getStoredEmail();
      if (!userEmail) return;
      
      setEmail(userEmail);
      setLoading(false);
    };

    verifyEmailAndLoad();
  }, [navigate]);

  // Enhanced email checking before any operation
  const ensureEmailExists = () => {
    if (!email) {
      // Try to get it again in case state was lost
      const storedEmail = localStorage.getItem("email") || Cookies.get("email");
      if (storedEmail) {
        setEmail(storedEmail);
        return storedEmail;
      }
      toast.error("Session expired. Please register again.");
      navigate("/register");
      return false;
    }
    return email;
  };


  // Send OTP function
  const handleSendOtp = async () => {
    if (!validatePhoneAndAadhaar()) return;

    try {
      console.log("📩 Sending OTP to:", phone);
      const response = await fetch("http://localhost:7000/api/otp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone, 
          email,
          aadhaarNumber: aadhaar // Using consistent naming with backend
        }),
      });

      const data = await response.json();
      console.log("✅ OTP Response:", data);

      if (response.ok) {
        toast.success("OTP sent successfully!");
        setSessionId(data.sessionId);
        setStep(2);
        startTimer();
      } else {
        throw new Error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("❌ [Send OTP Error]", error);
      toast.error(error.message || "Server error. Please try again.");
    }
  };

  // Verify OTP function
  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP");
      return;
    }

    try {
      console.log("🔍 Verifying OTP for session:", sessionId);
      const response = await fetch("http://localhost:7000/api/otp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId, 
          otp: enteredOtp,
          aadhaarNumber: aadhaar // Include aadhaar in verification
        }),
      });

      const data = await response.json();
      console.log("✅ Verification Response:", data);

      if (response.ok) {
        toast.success("OTP Verified!");
        setVerified(true);
        setStep(3);
      } else {
        throw new Error(data.error || "Invalid OTP");
      }
    } catch (error) {
      console.error("❌ [Verify OTP Error]", error);
      toast.error(error.message || "Verification failed");
    }
  };

  // File upload handler
  
  const handleFileUpload = async () => {
    const currentEmail = ensureEmailExists();
    if (!currentEmail || !validateFile()) return;
  
    setUploading(true);
    const formData = new FormData();
    formData.append("aadhaarFile", aadhaarFile);
    formData.append("email", currentEmail);
    formData.append("aadhaarNumber", aadhaar);
    formData.append("phone", phone);
  
    try {
      const response = await fetch("http://localhost:7000/api/aadhaar/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }
  
      toast.success("Aadhaar uploaded successfully!");
      // Keep email in storage for next page
      localStorage.setItem("email", currentEmail); 
      navigate("/portfolio");
    } catch (error) {
      console.error("❌ [Upload Error]", error);
      toast.error(error.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  // Helper Functions
  const validatePhoneAndAadhaar = () => {
    if (!email) {
      toast.error("Session expired. Please register again.");
      navigate("/register");
      return false;
    }

    if (aadhaar.length !== 12 || phone.length !== 10) {
      toast.error("Enter valid 12-digit Aadhaar and 10-digit phone number");
      return false;
    }

    return true;
  };

  const validateFile = () => {
    if (!aadhaarFile) {
      toast.error("Please select an Aadhaar file");
      return false;
    }

    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg"
    ];

    if (!validTypes.includes(aadhaarFile.type)) {
      toast.error("Only PDF, JPEG, or PNG files allowed");
      return false;
    }

    if (aadhaarFile.size > 5 * 1024 * 1024) { // 5MB
      toast.error("File size must be less than 5MB");
      return false;
    }

    return true;
  };

  const startTimer = () => {
    let countdown = 45;
    setTimer(countdown);
    
    const interval = setInterval(() => {
      countdown--;
      setTimer(countdown);
      
      if (countdown === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "").slice(0, 1); // Only allow digits
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Don't render if still loading or email not verified
  if (loading || !email) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying your session...</p>
      </div>
    );
  }
  
  return (
    <div className="aadhaar-container">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="glass-card">
        <div className="step-header">🔒 Verification Required</div>
        <h2 className="step-title">Let's verify your identity</h2>

        {step === 1 && (
          <>
            <p className="step-subtext">Enter your 12-digit Aadhaar and 10-digit mobile number.</p>
            <div className="input-floating">
              <input
                type="text"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                maxLength={12}
                required
              />
              <label>Aadhaar Number</label>
            </div>

            <div className="input-floating">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                maxLength={10}
                required
              />
              <label>Phone Number</label>
            </div>

            <button className="verify-btn" onClick={handleSendOtp}>
              Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="otp-section">
              <label className="otp-label">Enter OTP</label>
              <div className="otp-inputs">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    className="otp-box"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                  />
                ))}
              </div>
              <p className="otp-info">
                OTP sent to +91 {phone.slice(0, 2)}*****{phone.slice(-3)} &nbsp;
                {timer > 0 ? (
                  <span className="otp-timer">00:{timer.toString().padStart(2, "0")}</span>
                ) : (
                  <span className="resend-link" onClick={handleSendOtp}>
                    Resend OTP
                  </span>
                )}
              </p>
              <button className="verify-btn" onClick={handleVerifyOtp}>
                Verify OTP
              </button>
            </div>
          </>
        )}

        {step === 3 && verified && (
          <>
            <div className="upload-section">
              <label className="upload-label">Upload Aadhaar Card (PDF or Image)</label>
              <input type="file" accept=".pdf,image/*" onChange={(e) => setAadhaarFile(e.target.files[0])} />
            </div>
            <button className="upload-btn" onClick={handleFileUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Aadhaar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AadhaarOtpVerification;