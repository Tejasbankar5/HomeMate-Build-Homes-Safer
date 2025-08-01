import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie"; // ✅ Import js-cookie
import "./register.css";

const ServiceProviderRegister = () => {
  const [formData, setFormData] = useState({
    email: "",
    phone_number: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Input changed: ${name} = ${value}`);
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 Submitting form...");
    console.log("🔼 Form Data:", formData);

    try {
      const res = await axios.post("http://localhost:7000/register", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Response received from backend:");
      console.log("📦 Status:", res.status);
      console.log("📨 Data:", res.data);

      if (res.status === 200 || res.status === 201) {
        const { serviceProviderId, email } = res.data;

        // ✅ Store provider ID & email in cookies
        Cookies.set("serviceProviderId", serviceProviderId, { expires: 1 }); // 1-day expiry
        Cookies.set("serviceProviderEmail", email, { expires: 1 });

        toast.success("🎉 Registration successful! Redirecting...", {
          icon: "✅",
        });

        // Delay navigation so user sees the toast
        setTimeout(() => {
          navigate("/authphase1");
        }, 2000);
      } else {
        toast.error(`⚠️ Unexpected response status: ${res.status}`);
      }
    } catch (error) {
      console.error("❌ Error during registration request:");
      if (error.response) {
        console.error("📡 Response data:", error.response.data);
        toast.error(`🚫 ${error.response.data.message || "Registration failed"}`);
      } else if (error.request) {
        console.error("📭 No response received.");
        toast.error("Server not responding. Check if backend is running.");
      } else {
        console.error("💥 Request setup error:", error.message);
        toast.error("Something went wrong. Please try again.");
      }
    }
  };
  
  return (
    <div className="register-container">
      <div className="register-box">
        <div className="image-side"></div>

        <div className="form-side">
          <h1 className="brand">HomeMate</h1>
          <h2>Create Your Service Provider Account</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="phone_number"
              placeholder="Phone Number"
              value={formData.phone_number}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Create Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit" className="primary-btn">Sign Up</button>
          </form>

          <div className="divider">or</div>

          

          <p className="login-link">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderRegister;
