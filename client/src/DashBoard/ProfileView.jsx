import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './viewProfile.css';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userEmail = localStorage.getItem('email');
        if (!userEmail) throw new Error('Please login to view profile');
        
        const { data } = await axios.get('http://localhost:7000/api/profiles/by-email', {
          params: { email: userEmail },
          headers: {
            'Cache-Control': 'no-cache'
          },
          withCredentials: true // 🛡️ Enable credentials for CORS
        });

        if (!data) throw new Error('No profile data received');
        
        setProfileData({
          ...data,
          created_at: data.created_at ? new Date(data.created_at) : null
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) return (
    <div className="profile-skeleton">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton-section">
          <div className="shimmer-container">
            <div className="shimmer-avatar"></div>
            <div className="shimmer-line w-75"></div>
            <div className="shimmer-line w-100"></div>
            <div className="shimmer-line w-50"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="error-card">
      <div className="error-icon">⚠️</div>
      <h3>Profile Error</h3>
      <p>{error}</p>
      <button className="retry-btn" onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );

  return (
    <div className="profile-glass-container">
      <div 
        className={`profile-card ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="profile-banner"></div>
        
        <div className="profile-avatar-container">
          <div className="avatar-ring">
            {profileData.profile_picture ? (
              <img
                src={profileData.profile_picture}
                alt="Profile"
                className="profile-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.svg';
                }}
              />
            ) : (
              <div className="avatar-initial">
                {profileData.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </div>
        <div className="profile-header">
          <h1 className="profile-name">
            {profileData.full_name || 'New User'}
            <span className="verified-badge">✓</span>
          </h1>
          <p className="profile-email">{profileData.email}</p>
          
          <div className="profile-meta">
            <span className="meta-item">
              <i className="icon-phone"></i> 
              {profileData.phone_number || 'Not provided'}
            </span>
            {profileData.business_name && (
              <span className="meta-item">
                <i className="icon-briefcase"></i>
                {profileData.business_name}
              </span>
            )}
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-section card-hover">
            <h2 className="section-title">
              <i className="icon-user"></i> Basic Info
            </h2>
            <div className="info-grid">
              <InfoItem icon="icon-calendar" label="Member Since" 
                value={profileData.created_at?.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} 
              />
              <InfoItem icon="icon-map" label="Address" value={profileData.address} />
            </div>
          </div>

          <div className="profile-section card-hover">
            <h2 className="section-title">
              <i className="icon-services"></i> Services
            </h2>
            <p className="services-text">{profileData.services_offered || 'Not specified'}</p>
          </div>

          {profileData.aadhaar_verification && (
            <div className="profile-section card-hover verification-badge">
              <h2 className="section-title">
                <i className="icon-verified"></i> Verification
              </h2>
              <InfoItem 
                icon="icon-id" 
                label="Aadhaar Number" 
                value={profileData.aadhaar_verification.aadhaar_number} 
              />
              {profileData.aadhaar_verification.file_url && (
                <a
                  href={profileData.aadhaar_verification.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="doc-btn"
                >
                  <i className="icon-download"></i> View Document
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="info-item">
    <i className={icon}></i>
    <div>
      <span className="info-label">{label}</span>
      <span className="info-value">{value || '—'}</span>
    </div>
  </div>
);

export default ProfilePage;
