import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './profile.css';

const ServiceProviderProfileCreation = () => {
  const [step, setStep] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    address: '',
    service_offered: '',
    profile_picture: null,
    previewImage: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const serviceOptions = [
    'Construction Services',
    'Architecture Services',
    'Electrical Services',
    'Plumbing Services'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      toast.error('Please select a valid image (JPEG, JPG, or PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        profile_picture: file,
        previewImage: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => fileInputRef.current.click();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.full_name || !formData.address || !formData.service_offered) {
      toast.error("Please fill all required fields");
      return;
    }

    const email = localStorage.getItem('email');
    if (!email || !email.includes('@')) {
      toast.error("Invalid email, please login again");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', email);
      formDataToSend.append('full_name', formData.full_name);
      formDataToSend.append('business_name', formData.business_name || '');
      formDataToSend.append('address', formData.address);
      formDataToSend.append('service_offered', formData.service_offered);
      
      if (formData.profile_picture) {
        formDataToSend.append('profile_picture', formData.profile_picture);
      }

      const response = await fetch('http://localhost:7000/api/create', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }

      toast.success('Profile created successfully!');
      localStorage.setItem('profile_id', data.profile_id);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.full_name) {
      toast.error("Please enter your full name");
      return;
    }
    if (step === 2 && !formData.address) {
      toast.error("Please enter your business address");
      return;
    }
    if (step === 4 && !formData.service_offered) {
      toast.error("Please select a service");
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className={`profile-creation-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </div>
      
      <div className="creation-card">
        <div className="progress-bar">
          {[1, 2, 3, 4, 5].map((num) => (
            <div 
              key={num} 
              className={`progress-step ${num === step ? 'active' : ''} ${num < step ? 'completed' : ''}`}
              onClick={() => num <= step && setStep(num)}
            >
              {num < step ? '✓' : num}
            </div>
          ))}
        </div>
        
        <h1 className="creation-title">
          {step === 1 && '🏢 Business Information'}
          {step === 2 && '📍 Service Location'}
          {step === 3 && '🖼️ Business Logo'}
          {step === 4 && '🛠️ Services Offered'}
          {step === 5 && '🔍 Review & Submit'}
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="step-content slide-in">
              <div className="input-group">
                <label htmlFor="full_name">Your Full Name*</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your full legal name"
                  required
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="business_name">Business Name</label>
                <input
                  type="text"
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="Your business name (if applicable)"
                />
              </div>
            </div>
          )}
          
          {/* Step 2: Address */}
          {step === 2 && (
            <div className="step-content slide-in">
              <div className="input-group">
                <label htmlFor="address">Business Address*</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Where you provide your services"
                  rows="3"
                  required
                />
              </div>
              <p className="input-hint">This helps customers find you in local searches</p>
            </div>
          )}
          
          {/* Step 3: Profile Picture */}
          {step === 3 && (
            <div className="step-content slide-in">
              <div className="upload-area" onClick={triggerFileInput}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                {formData.previewImage ? (
                  <div className="image-preview">
                    <img src={formData.previewImage} alt="Profile preview" />
                    <div className="change-image">Change Image</div>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">🏢</div>
                    <p>Upload your business logo or profile picture</p>
                    <p className="file-requirements">Max 5MB • JPG, PNG</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Step 4: Services */}
          {step === 4 && (
            <div className="step-content slide-in">
              <div className="input-group">
                <label>Select Your Primary Service*</label>
                <div className="service-options">
                  {serviceOptions.map((service) => (
                    <div key={service} className="service-option">
                      <input
                        type="radio"
                        id={service.toLowerCase().replace(' ', '-')}
                        name="service_offered"
                        value={service}
                        checked={formData.service_offered === service}
                        onChange={handleChange}
                        required
                      />
                      <label htmlFor={service.toLowerCase().replace(' ', '-')}>
                        {service}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 5: Review */}
          {step === 5 && (
            <div className="step-content slide-in">
              <div className="review-section">
                <h3>Review Your Business Profile</h3>
                <div className="review-item">
                  <span>Your Name:</span>
                  <span>{formData.full_name || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span>Business Name:</span>
                  <span>{formData.business_name || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span>Address:</span>
                  <span>{formData.address || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span>Primary Service:</span>
                  <span>{formData.service_offered || 'Not selected'}</span>
                </div>
                <div className="review-item">
                  <span>Business Logo:</span>
                  <span>{formData.profile_picture ? 'Uploaded' : 'Not uploaded'}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation buttons */}
          <div className="navigation-buttons">
            {step > 1 && (
              <button type="button" className="nav-button prev-button" onClick={prevStep}>
                Previous
              </button>
            )}
            {step < 5 ? (
              <button 
                type="button" 
                className="nav-button next-button" 
                onClick={nextStep}
                disabled={
                  (step === 1 && !formData.full_name) ||
                  (step === 2 && !formData.address) ||
                  (step === 4 && !formData.service_offered)
                }
              >
                Next
              </button>
            ) : (
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span> Creating...
                  </>
                ) : (
                  '✅ Create Business Profile'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Preview panel */}
      {step < 5 && (
        <div className="preview-panel">
          <h3>Profile Preview</h3>
          <div className="preview-card">
            {formData.previewImage ? (
              <img src={formData.previewImage} alt="Profile preview" className="preview-image" />
            ) : (
              <div className="preview-image-placeholder">🏢</div>
            )}
            <div className="preview-details">
              <h4>{formData.full_name || 'Your Name'}</h4>
              <h5>{formData.business_name || 'Your Business'}</h5>
              <p className="preview-address">{formData.address || 'Address will appear here'}</p>
              <p className="preview-services">
                <strong>Primary Service:</strong> {formData.service_offered || 'Not selected'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderProfileCreation;