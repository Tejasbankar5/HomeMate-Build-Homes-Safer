import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Cookies from "js-cookie"; // Import js-cookie for handling cookies
import "./register.css";

const ServiceProviderLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("🔐 Attempting login with:", { email, password });

    try {
      const res = await axios.post("http://localhost:7000/login", {
        email,
        password,
      });

      console.log("✅ Login response:", res.data);

      // Extract service provider ID from response
      const { serviceProviderId, email: providerEmail } = res.data;

      // Store service provider ID & email in cookies
      // Cookies.set("serviceProviderId", serviceProviderId, { expires: 1 }); // 1-day expiry
      // Cookies.set("serviceProviderEmail", providerEmail, { expires: 1 });
      localStorage.setItem('email',email)
      console.log(email);
      toast.success("✅ Login Successful! Redirecting...");

      // Navigate after 2.5s delay (matching toast duration)
      setTimeout(() => {
        navigate("/authphase1");
      }, 2500);
    } catch (error) {
      console.error("❌ Login failed:", error);
      toast.error(error.response?.data?.message || "Login failed. Try again.");
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="image-side"></div>

        <div className="form-side">
          <h1 className="brand">HomeMate</h1>
          <h2>Service Provider Login</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="primary-btn">Login</button>
          </form>

          <div className="divider">or</div>
          <button className="google-btn">Login with Google</button>

          <p className="login-link">
            Don’t have an account? <a href="/serviceregister">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderLogin;
