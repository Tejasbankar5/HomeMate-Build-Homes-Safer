import { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './portfolio.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const PortfolioVerificationForm = () => {
  const API_BASE_URL = 'http://localhost:7000';
  const SUBMIT_ENDPOINT = `${API_BASE_URL}/api/port/submit`;
  const navigate = useNavigate();

  // Location state
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Request location permission
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setLocationError(error.message);
          toast.warn('Please enable location services for better verification');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser');
      toast.warn('Location services not available in your browser');
    }
  }, []);

  const [formData, setFormData] = useState({
    portfolioLinks: '',
    experienceYears: 0,
    expertiseAreas: [],
    certifications: [],
    portfolioImages: null,
    experienceCerts: null,
    expertiseProof: null,
    certDocuments: null
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const expertiseOptions = [
    'Construction Contracts', 'Architechture ', 'Interior Designing',
    'Electric Fitting', 'Slab Work', 'Plumbing',
     '3D Modeling'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const handleExpertiseToggle = (area) => {
    const updatedAreas = formData.expertiseAreas.includes(area)
      ? formData.expertiseAreas.filter(item => item !== area)
      : [...formData.expertiseAreas, area];
    setFormData({ ...formData, expertiseAreas: updatedAreas });
  };

  const handleCertificationAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, e.target.value.trim()],
      });
      e.target.value = '';
    }
  };

  const removeCertification = (index) => {
    const updatedCerts = [...formData.certifications];
    updatedCerts.splice(index, 1);
    setFormData({ ...formData, certifications: updatedCerts });
  };

  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  const validateFileSize = (file, maxSizeMB) => {
    if (file && file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`${file.name} exceeds the maximum size of ${maxSizeMB}MB`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const email = localStorage.getItem('email');
    if (!email) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }
  
    if (!formData.portfolioLinks) {
      toast.error('Please provide portfolio links');
      return;
    }
  
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('email', email);
      formDataToSend.append('portfolioLinks', formData.portfolioLinks);
      formDataToSend.append('experienceYears', formData.experienceYears);
      formDataToSend.append('expertiseAreas', JSON.stringify(formData.expertiseAreas));
      formDataToSend.append('certifications', JSON.stringify(formData.certifications));
  
      // Append location if available
      if (location) {
        formDataToSend.append('latitude', location.latitude);
        formDataToSend.append('longitude', location.longitude);
      }
  
      if (formData.portfolioImages) formDataToSend.append('portfolioImages', formData.portfolioImages);
      if (formData.experienceCerts) formDataToSend.append('experienceCerts', formData.experienceCerts);
      if (formData.expertiseProof) formDataToSend.append('expertiseProof', formData.expertiseProof);
      if (formData.certDocuments) formDataToSend.append('certDocuments', formData.certDocuments);
  
      console.log('Submission data:', {
        email,
        portfolioLinks: formData.portfolioLinks,
        expertiseAreas: formData.expertiseAreas,
        certifications: formData.certifications,
        location
      });
  
      const response = await axios.post(SUBMIT_ENDPOINT, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
  
      if (response.data.success) {
        toast.success('Portfolio submitted successfully!');
        setTimeout(() => navigate('/profile'), 3000);
      }
    } catch (error) {
      console.error('Submission error:', {
        message: error.message,
        response: error.response?.data,
        config: error.config
      });
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="verification-container">
      <ToastContainer />
      
      {locationError && (
        <div className="location-permission-banner">
          <p>Please enable location services for verification purposes</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}
      
      <div className="progress-bar">
        {[1, 2, 3].map((step) => (
          <div 
            key={step} 
            className={`progress-step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
          >
            <div className="step-number">{step}</div>
            <div className="step-label">
              {step === 1 ? 'Basic Info' : step === 2 ? 'Expertise' : 'Documents'}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="verification-form">
        {currentStep === 1 && (
          <div className="form-step">
            <h2>Portfolio Basics</h2>
            <div className="input-group">
              <label>Portfolio Links (comma separated)</label>
              <textarea
                name="portfolioLinks"
                value={formData.portfolioLinks}
                onChange={handleInputChange}
                placeholder="https://example.com/portfolio, https://example.com/work..."
                required
              />
              <div className="hint">Include links to your online portfolio, Behance, Dribbble, etc.</div>
            </div>

            <div className="input-group">
              <label>Years of Experience</label>
              <div className="slider-container">
                <input
                  type="range"
                  name="experienceYears"
                  min="0"
                  max="30"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  className="slider-input"
                />
                <div className="slider-value">{formData.experienceYears} years</div>
              </div>
            </div>

            <div className="form-navigation">
              <button type="button" className="btn next" onClick={nextStep}>
                Next: Expertise
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-step">
            <h2>Your Expertise</h2>
            
            <div className="input-group">
              <label>Areas of Expertise</label>
              <div className="expertise-tags">
                {expertiseOptions.map((area) => (
                  <button
                    key={area}
                    type="button"
                    className={`expertise-tag ${formData.expertiseAreas.includes(area) ? 'selected' : ''}`}
                    onClick={() => handleExpertiseToggle(area)}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Certifications (Press Enter to add)</label>
              <input
                type="text"
                onKeyDown={handleCertificationAdd}
                placeholder="Type certification and press Enter"
                className="certification-input"
              />
              <div className="certification-tags">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="certification-tag">
                    {cert}
                    <button type="button" onClick={() => removeCertification(index)}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-navigation">
              <button type="button" className="btn prev" onClick={prevStep}>
                Back
              </button>
              <button type="button" className="btn next" onClick={nextStep}>
                Next: Documents
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="form-step">
            <h2>Supporting Documents</h2>
            
            <div className="file-upload-group">
              <label>Portfolio Images (Max 5MB)</label>
              <FileUploadBox
                name="portfolioImages"
                onChange={handleFileChange}
                acceptedFormats="image/*"
              />
            </div>

            <div className="file-upload-group">
              <label>Experience Certificates (PDF, Max 10MB)</label>
              <FileUploadBox
                name="experienceCerts"
                onChange={handleFileChange}
                acceptedFormats=".pdf,.doc,.docx"
              />
            </div>

            <div className="file-upload-group">
              <label>Expertise Proof (PDF/Images, Max 10MB)</label>
              <FileUploadBox
                name="expertiseProof"
                onChange={handleFileChange}
                acceptedFormats=".pdf,.doc,.docx,image/*"
              />
            </div>

            <div className="file-upload-group">
              <label>Certification Documents (PDF, Max 10MB)</label>
              <FileUploadBox
                name="certDocuments"
                onChange={handleFileChange}
                acceptedFormats=".pdf,.doc,.docx"
              />
            </div>

            <div className="form-navigation">
              <button type="button" className="btn prev" onClick={prevStep}>
                Back
              </button>
              <button type="submit" className="btn submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

const FileUploadBox = ({ name, onChange, acceptedFormats }) => {
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
      onChange(e);
    }
  };

  return (
    <div className="file-upload-box">
      <label htmlFor={name}>
        <div className="upload-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p>{fileName || 'Click to upload or drag and drop'}</p>
          {fileName && (
            <button type="button" onClick={() => setFileName('')} className="clear-file">
              ×
            </button>
          )}
        </div>
        <input
          type="file"
          id={name}
          name={name}
          onChange={handleFileChange}
          accept={acceptedFormats}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
};

export default PortfolioVerificationForm;


























// import { useState } from 'react';
// import axios from 'axios';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import './portfolio.css';
// import { useNavigate } from 'react-router-dom';
// import Cookies from 'js-cookie';

// const PortfolioVerificationForm = () => {
//   const API_BASE_URL = 'http://localhost:7000';
//   const SUBMIT_ENDPOINT = `${API_BASE_URL}/api/port/submit`; // FIXED ENDPOINT PATH
//   const navigate = useNavigate();

//   // const email = Cookies.get('email');
//   const [formData, setFormData] = useState({
//     portfolioLinks: '',
//     experienceYears: 0,
//     expertiseAreas: [],
//     certifications: [],
//     portfolioImages: null,
//     experienceCerts: null,
//     expertiseProof: null,
//     certDocuments: null
//   });
//   const [currentStep, setCurrentStep] = useState(1);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitSuccess, setSubmitSuccess] = useState(false);

//   const expertiseOptions = [
//     'Construction Contracts', 'Architechture ', 'Interior Designing',
//     'Electric Fitting', 'Slab Work', 'Plumbing',
//      '3D Modeling'
//   ];

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleFileChange = (e) => {
//     const { name, files } = e.target;
//     setFormData({ ...formData, [name]: files[0] });
//   };

//   const handleExpertiseToggle = (area) => {
//     const updatedAreas = formData.expertiseAreas.includes(area)
//       ? formData.expertiseAreas.filter(item => item !== area)
//       : [...formData.expertiseAreas, area];
//     setFormData({ ...formData, expertiseAreas: updatedAreas });
//   };

//   const handleCertificationAdd = (e) => {
//     if (e.key === 'Enter' && e.target.value.trim()) {
//       setFormData({
//         ...formData,
//         certifications: [...formData.certifications, e.target.value.trim()],
//       });
//       e.target.value = '';
//     }
//   };

//   const removeCertification = (index) => {
//     const updatedCerts = [...formData.certifications];
//     updatedCerts.splice(index, 1);
//     setFormData({ ...formData, certifications: updatedCerts });
//   };

//   const nextStep = () => setCurrentStep(currentStep + 1);
//   const prevStep = () => setCurrentStep(currentStep - 1);

//   const validateFileSize = (file, maxSizeMB) => {
//     if (file && file.size > maxSizeMB * 1024 * 1024) {
//       toast.error(`${file.name} exceeds the maximum size of ${maxSizeMB}MB`);
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // 1. Validate email exists
//     const email = localStorage.getItem('email');
//     if (!email) {
//       toast.error('Session expired. Please login again.');
//       navigate('/login');
//       return;
//     }
  
//     // 2. Validate required fields
//     if (!formData.portfolioLinks) {
//       toast.error('Please provide portfolio links');
//       return;
//     }
  
//     setIsSubmitting(true);
    
//     try {
//       const formDataToSend = new FormData();
      
//       // 3. Append all data
//       formDataToSend.append('email', email);
//       formDataToSend.append('portfolioLinks', formData.portfolioLinks);
//       formDataToSend.append('experienceYears', formData.experienceYears);
//       formDataToSend.append('expertiseAreas', JSON.stringify(formData.expertiseAreas));
//       formDataToSend.append('certifications', JSON.stringify(formData.certifications));
  
//       // 4. Append files if they exist
//       if (formData.portfolioImages) formDataToSend.append('portfolioImages', formData.portfolioImages);
//       if (formData.experienceCerts) formDataToSend.append('experienceCerts', formData.experienceCerts);
//       if (formData.expertiseProof) formDataToSend.append('expertiseProof', formData.expertiseProof);
//       if (formData.certDocuments) formDataToSend.append('certDocuments', formData.certDocuments);
  
//       // 5. Debug output
//       console.log('Submission data:', {
//         email,
//         portfolioLinks: formData.portfolioLinks,
//         expertiseAreas: formData.expertiseAreas,
//         certifications: formData.certifications
//       });
  
//       // 6. Make the request
//       const response = await axios.post(SUBMIT_ENDPOINT, formDataToSend, {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         },
//         withCredentials: true
//       });
  
//       if (response.data.success) {
//         toast.success('Portfolio submitted successfully!');
//         setTimeout(() => navigate('/profile'), 3000); // Reduced from 10s to 3s
//       }
//     } catch (error) {
//       console.error('Submission error:', {
//         message: error.message,
//         response: error.response?.data,
//         config: error.config
//       });
//       toast.error(error.response?.data?.message || 'Submission failed');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
//   return (
//     <div className="verification-container">
//       <ToastContainer />
//       <div className="progress-bar">
//         {[1, 2, 3].map((step) => (
//           <div 
//             key={step} 
//             className={`progress-step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
//           >
//             <div className="step-number">{step}</div>
//             <div className="step-label">
//               {step === 1 ? 'Basic Info' : step === 2 ? 'Expertise' : 'Documents'}
//             </div>
//           </div>
//         ))}
//       </div>

//       <form onSubmit={handleSubmit} className="verification-form">
//         {currentStep === 1 && (
//           <div className="form-step">
//             <h2>Portfolio Basics</h2>
//             <div className="input-group">
//               <label>Portfolio Links (comma separated)</label>
//               <textarea
//                 name="portfolioLinks"
//                 value={formData.portfolioLinks}
//                 onChange={handleInputChange}
//                 placeholder="https://example.com/portfolio, https://example.com/work..."
//                 required
//               />
//               <div className="hint">Include links to your online portfolio, Behance, Dribbble, etc.</div>
//             </div>

//             <div className="input-group">
//               <label>Years of Experience</label>
//               <div className="slider-container">
//                 <input
//                   type="range"
//                   name="experienceYears"
//                   min="0"
//                   max="30"
//                   value={formData.experienceYears}
//                   onChange={handleInputChange}
//                   className="slider-input"
//                 />
//                 <div className="slider-value">{formData.experienceYears} years</div>
//               </div>
//             </div>

//             <div className="form-navigation">
//               <button type="button" className="btn next" onClick={nextStep}>
//                 Next: Expertise
//               </button>
//             </div>
//           </div>
//         )}

//         {currentStep === 2 && (
//           <div className="form-step">
//             <h2>Your Expertise</h2>
            
//             <div className="input-group">
//               <label>Areas of Expertise</label>
//               <div className="expertise-tags">
//                 {expertiseOptions.map((area) => (
//                   <button
//                     key={area}
//                     type="button"
//                     className={`expertise-tag ${formData.expertiseAreas.includes(area) ? 'selected' : ''}`}
//                     onClick={() => handleExpertiseToggle(area)}
//                   >
//                     {area}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="input-group">
//               <label>Certifications (Press Enter to add)</label>
//               <input
//                 type="text"
//                 onKeyDown={handleCertificationAdd}
//                 placeholder="Type certification and press Enter"
//                 className="certification-input"
//               />
//               <div className="certification-tags">
//                 {formData.certifications.map((cert, index) => (
//                   <div key={index} className="certification-tag">
//                     {cert}
//                     <button type="button" onClick={() => removeCertification(index)}>×</button>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="form-navigation">
//               <button type="button" className="btn prev" onClick={prevStep}>
//                 Back
//               </button>
//               <button type="button" className="btn next" onClick={nextStep}>
//                 Next: Documents
//               </button>
//             </div>
//           </div>
//         )}

//         {currentStep === 3 && (
//           <div className="form-step">
//             <h2>Supporting Documents</h2>
            
//             <div className="file-upload-group">
//               <label>Portfolio Images (Max 5MB)</label>
//               <FileUploadBox
//                 name="portfolioImages"
//                 onChange={handleFileChange}
//                 acceptedFormats="image/*"
//               />
//             </div>

//             <div className="file-upload-group">
//               <label>Experience Certificates (PDF, Max 10MB)</label>
//               <FileUploadBox
//                 name="experienceCerts"
//                 onChange={handleFileChange}
//                 acceptedFormats=".pdf,.doc,.docx"
//               />
//             </div>

//             <div className="file-upload-group">
//               <label>Expertise Proof (PDF/Images, Max 10MB)</label>
//               <FileUploadBox
//                 name="expertiseProof"
//                 onChange={handleFileChange}
//                 acceptedFormats=".pdf,.doc,.docx,image/*"
//               />
//             </div>

//             <div className="file-upload-group">
//               <label>Certification Documents (PDF, Max 10MB)</label>
//               <FileUploadBox
//                 name="certDocuments"
//                 onChange={handleFileChange}
//                 acceptedFormats=".pdf,.doc,.docx"
//               />
//             </div>

//             <div className="form-navigation">
//               <button type="button" className="btn prev" onClick={prevStep}>
//                 Back
//               </button>
//               <button type="submit" className="btn submit" disabled={isSubmitting}>
//                 {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
//               </button>
//             </div>
//           </div>
//         )}
//       </form>
//     </div>
//   );
// };

// const FileUploadBox = ({ name, onChange, acceptedFormats }) => {
//   const [fileName, setFileName] = useState('');

//   const handleFileChange = (e) => {
//     if (e.target.files.length > 0) {
//       setFileName(e.target.files[0].name);
//       onChange(e);
//     }
//   };

//   return (
//     <div className="file-upload-box">
//       <label htmlFor={name}>
//         <div className="upload-content">
//           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
//             <polyline points="17 8 12 3 7 8"></polyline>
//             <line x1="12" y1="3" x2="12" y2="15"></line>
//           </svg>
//           <p>{fileName || 'Click to upload or drag and drop'}</p>
//           {fileName && (
//             <button type="button" onClick={() => setFileName('')} className="clear-file">
//               ×
//             </button>
//           )}
//         </div>
//         <input
//           type="file"
//           id={name}
//           name={name}
//           onChange={handleFileChange}
//           accept={acceptedFormats}
//           style={{ display: 'none' }}
//         />
//       </label>
//     </div>
//   );
// };

// export default PortfolioVerificationForm;

