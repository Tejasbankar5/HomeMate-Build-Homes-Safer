import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './settings.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    profile: {
      full_name: '',
      email: '',
      phone_number: '',
      business_name: '',
      address: '',
      services_offered: { type: '', expertise: '' },
      profile_picture: ''
    },
    aadhaar: {
      aadhaar_number: '',
      phone: '',
      file_url: '',
      verification_status: 'pending'
    },
    portfolio: {
      portfolioLinks: '',
      experienceYears: 0,
      expertiseAreas: '',
      certifications: '',
      portfolioImages: '',
      experienceCerts: '',
      expertiseProof: '',
      certDocuments: '',
      verification_status: 'pending'
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [aadhaarPreview, setAadhaarPreview] = useState('');
  const [portfolioPreviews, setPortfolioPreviews] = useState({
    portfolioImages: '',
    experienceCerts: '',
    expertiseProof: '',
    certDocuments: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const email = localStorage.getItem('email');
        if (!email) {
          throw new Error('Email not found in local storage');
        }

        // Updated endpoint to match backend route
        const response = await axios.get('http://localhost:7000/api/settings', {
          params: { email },
          withCredentials: true // Include cookies if using session-based auth
        });

        if (response.data) {
          const { profile, aadhaar, portfolio } = response.data;
          
          setUserData(prev => ({
            ...prev,
            profile: {
              full_name: profile?.full_name || '',
              email: profile?.email || email,
              phone_number: profile?.phone_number || '',
              business_name: profile?.business_name || '',
              address: profile?.address || '',
              services_offered: profile?.services_offered || { type: '', expertise: '' },
              profile_picture: profile?.profile_picture || ''
            },
            aadhaar: aadhaar || prev.aadhaar,
            portfolio: portfolio || prev.portfolio
          }));

          // Set previews
          if (profile?.profile_picture) {
            setAvatarPreview(profile.profile_picture);
          }
          if (aadhaar?.file_url) {
            setAadhaarPreview(aadhaar.file_url);
          }
          if (portfolio) {
            setPortfolioPreviews({
              portfolioImages: portfolio.portfolioImages || '',
              experienceCerts: portfolio.experienceCerts || '',
              expertiseProof: portfolio.expertiseProof || '',
              certDocuments: portfolio.certDocuments || ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrors(prev => ({
          ...prev,
          serverError: error.response?.data?.message || 
                     error.message || 
                     'Failed to load user data'
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (section, field, value) => {
    setUserData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e, section, field, previewField) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size and type if needed
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setErrors(prev => ({
          ...prev,
          [field]: 'File size must be less than 5MB'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Update the appropriate preview state
        const previewUpdaters = {
          avatarPreview: setAvatarPreview,
          aadhaarPreview: setAadhaarPreview
        };
        
        if (previewField in previewUpdaters) {
          previewUpdaters[previewField](reader.result);
        } else if (previewField) {
          setPortfolioPreviews(prev => ({
            ...prev,
            [previewField]: reader.result
          }));
        }
        
        // Update the actual file in state
        handleInputChange(section, field, file);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (section) => {
    const newErrors = {};
    const currentData = userData[section];

    if (section === 'profile') {
      if (!currentData.full_name.trim()) {
        newErrors.full_name = 'Full name is required';
      }
      if (!currentData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^\S+@\S+\.\S+$/.test(currentData.email)) {
        newErrors.email = 'Email is invalid';
      }
    }

    if (section === 'aadhaar') {
      if (!currentData.aadhaar_number) {
        newErrors.aadhaar_number = 'Aadhaar number is required';
      } else if (!/^\d{12}$/.test(currentData.aadhaar_number)) {
        newErrors.aadhaar_number = 'Aadhaar number must be 12 digits';
      }
      if (!currentData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(currentData.phone)) {
        newErrors.phone = 'Phone number must be 10 digits';
      }
    }

    if (section === 'portfolio') {
      if (!currentData.experienceYears || currentData.experienceYears < 0) {
        newErrors.experienceYears = 'Valid experience is required';
      }
    }

    if (section === 'security') {
      if (!currentData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      if (!currentData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (currentData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      if (currentData.newPassword !== currentData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (section) => {
    if (!validateForm(section)) return;

    try {
      const email = localStorage.getItem('email');
      if (!email) {
        throw new Error('Email not found in local storage');
      }

      const formData = new FormData();
      formData.append('email', email);

      let endpoint = `http://localhost:7000/api/settings/profile`;
      let config = {};

      if (section === 'profile') {
        Object.entries(userData.profile).forEach(([key, value]) => {
          if (key === 'services_offered') {
            formData.append(key, JSON.stringify(value));
          } else if (key !== 'profile_picture' || (key === 'profile_picture' && typeof value !== 'string')) {
            formData.append(key, value);
          }
        });
        config = { headers: { 'Content-Type': 'multipart/form-data' } };
      } 
      else if (section === 'aadhaar') {
        formData.append('aadhaar_number', userData.aadhaar.aadhaar_number);
        formData.append('phone', userData.aadhaar.phone);
        if (userData.aadhaar.file_url && typeof userData.aadhaar.file_url !== 'string') {
          formData.append('aadhaar_file', userData.aadhaar.file_url);
        }
        config = { headers: { 'Content-Type': 'multipart/form-data' } };
      } 
      else if (section === 'portfolio') {
        const portfolioData = {
          portfolioLinks: userData.portfolio.portfolioLinks,
          experienceYears: userData.portfolio.experienceYears,
          expertiseAreas: userData.portfolio.expertiseAreas,
          certifications: userData.portfolio.certifications,
          email
        };

        // Append files if they are new uploads
        const fileFields = [
          'portfolioImages',
          'experienceCerts',
          'expertiseProof',
          'certDocuments'
        ];
        
        fileFields.forEach(field => {
          if (userData.portfolio[field] && typeof userData.portfolio[field] !== 'string') {
            formData.append(field, userData.portfolio[field]);
          }
        });

        formData.append('data', JSON.stringify(portfolioData));
        config = { headers: { 'Content-Type': 'multipart/form-data' } };
      } 
      else if (section === 'security') {
        const response = await axios.put(
          'http://localhost:7000/api/settings/password',
          {
            email,
            currentPassword: userData.security.currentPassword,
            newPassword: userData.security.newPassword
          }
        );
        
        setSuccessMessage('Password updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }

      const response = await axios.put(endpoint, formData, config);
      
      setSuccessMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);

      // Update previews if needed
      if (section === 'profile' && response.data.profile_picture) {
        setAvatarPreview(response.data.profile_picture);
      }
      if (section === 'aadhaar' && response.data.file_url) {
        setAadhaarPreview(response.data.file_url);
      }
      if (section === 'portfolio') {
        const updatedPreviews = {};
        if (response.data.portfolioImages) updatedPreviews.portfolioImages = response.data.portfolioImages;
        if (response.data.experienceCerts) updatedPreviews.experienceCerts = response.data.experienceCerts;
        if (response.data.expertiseProof) updatedPreviews.expertiseProof = response.data.expertiseProof;
        if (response.data.certDocuments) updatedPreviews.certDocuments = response.data.certDocuments;
        
        setPortfolioPreviews(prev => ({
          ...prev,
          ...updatedPreviews
        }));
      }
    } catch (error) {
      console.error(`Error updating ${section}:`, error);
      setErrors(prev => ({
        ...prev,
        serverError: error.response?.data?.message || 
                   error.message || 
                   `Failed to update ${section}`
      }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('email');
    localStorage.removeItem('token'); // If using token-based auth
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>Loading your settings...</p>
      </div>
    );
  }
  return (
    <div className="settings-container">
      <div className="settings-sidebar">
        <div className="user-profile-summary">
          <div className="avatar-container">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="user-avatar" />
            ) : (
              <div className="avatar-placeholder">
                {userData.profile.full_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3>{userData.profile.full_name}</h3>
          <p>{userData.profile.email}</p>
          {userData.aadhaar.verification_status === 'verified' && (
            <div className="verification-badge">
              <i className="icon-verified"></i> Verified
            </div>
          )}
        </div>
        
        <nav className="settings-nav">
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="icon-user"></i> Profile
          </button>
          <button 
            className={`nav-item ${activeTab === 'aadhaar' ? 'active' : ''}`}
            onClick={() => setActiveTab('aadhaar')}
          >
            <i className="icon-id"></i> Aadhaar
          </button>
          <button 
            className={`nav-item ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <i className="icon-briefcase"></i> Portfolio
          </button>
          <button 
            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="icon-lock"></i> Security
          </button>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <i className="icon-logout"></i> Logout
          </button>
        </nav>
      </div>
      
      <div className="settings-content">
        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}
        
        {errors.serverError && (
          <div className="alert alert-error">
            {errors.serverError}
          </div>
        )}
        
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div className="settings-section">
            <h2>Profile Settings</h2>
            <div className="avatar-upload">
              <div className="avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile Preview" />
                ) : (
                  <div className="avatar-placeholder">
                    {userData.profile.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label className="upload-btn">
                Change Avatar
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'profile', 'profile_picture', 'avatarPreview')}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={userData.profile.full_name}
                onChange={(e) => handleInputChange('profile', 'full_name', e.target.value)}
                className={errors.full_name ? 'error' : ''}
              />
              {errors.full_name && <span className="error-message">{errors.full_name}</span>}
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={userData.profile.email}
                onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                className={errors.email ? 'error' : ''}
                disabled
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={userData.profile.phone_number}
                onChange={(e) => handleInputChange('profile', 'phone_number', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Business Name</label>
              <input
                type="text"
                value={userData.profile.business_name}
                onChange={(e) => handleInputChange('profile', 'business_name', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <textarea
                value={userData.profile.address}
                onChange={(e) => handleInputChange('profile', 'address', e.target.value)}
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>Services Offered</label>
              <div className="services-group">
                <div>
                  <label>Type</label>
                  <input
                    type="text"
                    value={userData.profile.services_offered.type}
                    onChange={(e) => handleInputChange('profile', 'services_offered', {
                      ...userData.profile.services_offered,
                      type: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label>Expertise</label>
                  <select
                    value={userData.profile.services_offered.expertise}
                    onChange={(e) => handleInputChange('profile', 'services_offered', {
                      ...userData.profile.services_offered,
                      expertise: e.target.value
                    })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button 
              className="save-btn"
              onClick={() => handleSubmit('profile')}
            >
              Save Profile
            </button>
          </div>
        )}
        
        {/* Aadhaar Settings */}
        {activeTab === 'aadhaar' && (
          <div className="settings-section">
            <h2>Aadhaar Verification</h2>
            {userData.aadhaar.verification_status === 'verified' && (
              <div className="verification-status verified">
                <i className="icon-check"></i> Your Aadhaar is verified
              </div>
            )}
            {userData.aadhaar.verification_status === 'pending' && (
              <div className="verification-status pending">
                <i className="icon-clock"></i> Your Aadhaar verification is pending
              </div>
            )}
            {userData.aadhaar.verification_status === 'rejected' && (
              <div className="verification-status rejected">
                <i className="icon-warning"></i> Your Aadhaar verification was rejected
              </div>
            )}
            
            <div className="form-group">
              <label>Aadhaar Number</label>
              <input
                type="text"
                value={userData.aadhaar.aadhaar_number}
                onChange={(e) => handleInputChange('aadhaar', 'aadhaar_number', e.target.value)}
                className={errors.aadhaar_number ? 'error' : ''}
                maxLength="12"
              />
              {errors.aadhaar_number && <span className="error-message">{errors.aadhaar_number}</span>}
            </div>
            
            <div className="form-group">
              <label>Registered Phone Number</label>
              <input
                type="tel"
                value={userData.aadhaar.phone}
                onChange={(e) => handleInputChange('aadhaar', 'phone', e.target.value)}
                className={errors.phone ? 'error' : ''}
                maxLength="10"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
            
            <div className="form-group">
              <label>Aadhaar Document</label>
              {aadhaarPreview ? (
                <div className="document-preview">
                  <img src={aadhaarPreview} alt="Aadhaar Document Preview" />
                  <label className="replace-btn">
                    Replace Document
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={(e) => handleFileChange(e, 'aadhaar', 'file_url', 'aadhaarPreview')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              ) : (
                <label className="upload-btn">
                  Upload Aadhaar Document
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={(e) => handleFileChange(e, 'aadhaar', 'file_url', 'aadhaarPreview')}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
              <p className="hint">Upload a clear image or PDF of your Aadhaar card</p>
            </div>
            
            <button 
              className="save-btn"
              onClick={() => handleSubmit('aadhaar')}
              disabled={userData.aadhaar.verification_status === 'verified'}
            >
              {userData.aadhaar.verification_status === 'verified' ? 'Already Verified' : 'Submit for Verification'}
            </button>
          </div>
        )}
        
        {/* Portfolio Settings */}
        {activeTab === 'portfolio' && (
          <div className="settings-section">
            <h2>Portfolio Verification</h2>
            {userData.portfolio.verification_status === 'verified' && (
              <div className="verification-status verified">
                <i className="icon-check"></i> Your portfolio is verified
              </div>
            )}
            {userData.portfolio.verification_status === 'pending' && (
              <div className="verification-status pending">
                <i className="icon-clock"></i> Your portfolio verification is pending
              </div>
            )}
            {userData.portfolio.verification_status === 'rejected' && (
              <div className="verification-status rejected">
                <i className="icon-warning"></i> Your portfolio verification was rejected
              </div>
            )}
            
            <div className="form-group">
              <label>Years of Experience</label>
              <input
                type="number"
                value={userData.portfolio.experienceYears}
                onChange={(e) => handleInputChange('portfolio', 'experienceYears', parseInt(e.target.value) || 0)}
                className={errors.experienceYears ? 'error' : ''}
                min="0"
              />
              {errors.experienceYears && <span className="error-message">{errors.experienceYears}</span>}
            </div>
            
            <div className="form-group">
              <label>Portfolio Links (comma separated)</label>
              <textarea
                value={userData.portfolio.portfolioLinks}
                onChange={(e) => handleInputChange('portfolio', 'portfolioLinks', e.target.value)}
                rows="2"
                placeholder="https://example.com/portfolio, https://linkedin.com/in/yourprofile"
              />
            </div>
            
            <div className="form-group">
              <label>Areas of Expertise</label>
              <textarea
                value={userData.portfolio.expertiseAreas}
                onChange={(e) => handleInputChange('portfolio', 'expertiseAreas', e.target.value)}
                rows="3"
                placeholder="Describe your areas of expertise and specializations"
              />
            </div>
            
            <div className="form-group">
              <label>Certifications</label>
              <textarea
                value={userData.portfolio.certifications}
                onChange={(e) => handleInputChange('portfolio', 'certifications', e.target.value)}
                rows="3"
                placeholder="List your certifications and qualifications"
              />
            </div>
            
            <div className="form-group">
              <label>Portfolio Images</label>
              {portfolioPreviews.portfolioImages ? (
                <div className="document-preview">
                  <img src={portfolioPreviews.portfolioImages} alt="Portfolio Preview" />
                  <label className="replace-btn">
                    Replace Image
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'portfolio', 'portfolioImages', 'portfolioImages')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              ) : (
                <label className="upload-btn">
                  Upload Portfolio Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'portfolio', 'portfolioImages', 'portfolioImages')}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            
            <div className="form-group">
              <label>Experience Certificates</label>
              {portfolioPreviews.experienceCerts ? (
                <div className="document-preview">
                  <img src={portfolioPreviews.experienceCerts} alt="Experience Certificates Preview" />
                  <label className="replace-btn">
                    Replace Document
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={(e) => handleFileChange(e, 'portfolio', 'experienceCerts', 'experienceCerts')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              ) : (
                <label className="upload-btn">
                  Upload Experience Certificates
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={(e) => handleFileChange(e, 'portfolio', 'experienceCerts', 'experienceCerts')}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            
            <div className="form-group">
              <label>Expertise Proof</label>
              {portfolioPreviews.expertiseProof ? (
                <div className="document-preview">
                  <img src={portfolioPreviews.expertiseProof} alt="Expertise Proof Preview" />
                  <label className="replace-btn">
                    Replace Document
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={(e) => handleFileChange(e, 'portfolio', 'expertiseProof', 'expertiseProof')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              ) : (
                <label className="upload-btn">
                  Upload Expertise Proof
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={(e) => handleFileChange(e, 'portfolio', 'expertiseProof', 'expertiseProof')}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            
            <div className="form-group">
              <label>Certification Documents</label>
              {portfolioPreviews.certDocuments ? (
                <div className="document-preview">
                  <img src={portfolioPreviews.certDocuments} alt="Certification Documents Preview" />
                  <label className="replace-btn">
                    Replace Document
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={(e) => handleFileChange(e, 'portfolio', 'certDocuments', 'certDocuments')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              ) : (
                <label className="upload-btn">
                  Upload Certification Documents
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    onChange={(e) => handleFileChange(e, 'portfolio', 'certDocuments', 'certDocuments')}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
            
            <button 
              className="save-btn"
              onClick={() => handleSubmit('portfolio')}
              disabled={userData.portfolio.verification_status === 'verified'}
            >
              {userData.portfolio.verification_status === 'verified' ? 'Already Verified' : 'Submit for Verification'}
            </button>
          </div>
        )}
        
        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <h2>Security Settings</h2>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={userData.security.currentPassword}
                onChange={(e) => handleInputChange('security', 'currentPassword', e.target.value)}
                className={errors.currentPassword ? 'error' : ''}
              />
              {errors.currentPassword && <span className="error-message">{errors.currentPassword}</span>}
            </div>
            
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={userData.security.newPassword}
                onChange={(e) => handleInputChange('security', 'newPassword', e.target.value)}
                className={errors.newPassword ? 'error' : ''}
              />
              {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
            </div>
            
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={userData.security.confirmPassword}
                onChange={(e) => handleInputChange('security', 'confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
            
            <div className="security-tips">
              <h4>Password Requirements:</h4>
              <ul>
                <li>Minimum 8 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one number</li>
                <li>At least one special character</li>
              </ul>
            </div>
            
            <button 
              className="save-btn"
              onClick={() => handleSubmit('security')}
            >
              Change Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;