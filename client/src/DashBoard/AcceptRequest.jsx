import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiMail,
  FiHome,
  FiUpload,
  FiSend
} from 'react-icons/fi';
import './acceptRequest.css';
const AcceptRequestPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    laborCost: '',
    materialCost: '',
    otherCost: '',
    totalCost: '',
    startDate: '',
    completionDate: '',
    termsAccepted: false,
    quotationFile: null
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let updatedFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    };

    if (name === 'quotationFile' && files[0]) {
      const fileUrl = URL.createObjectURL(files[0]);
      setPreviewUrl(fileUrl);
    }

    if (["laborCost", "materialCost", "otherCost"].includes(name)) {
      const labor = parseFloat(name === 'laborCost' ? value : formData.laborCost) || 0;
      const material = parseFloat(name === 'materialCost' ? value : formData.materialCost) || 0;
      const other = parseFloat(name === 'otherCost' ? value : formData.otherCost) || 0;
      updatedFormData.totalCost = (labor + material + other).toFixed(2);
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const requestId = localStorage.getItem('currentRequestId');
    const providerEmail = localStorage.getItem('email');

    if (!requestId || !providerEmail) {
      setError('Required information not found. Please login again.');
      setLoading(false);
      return;
    }

    const formPayload = new FormData();
    formPayload.append('requestId', requestId);
    formPayload.append('providerEmail', providerEmail);
    formPayload.append('laborCost', formData.laborCost);
    formPayload.append('materialCost', formData.materialCost);
    formPayload.append('otherCost', formData.otherCost);
    formPayload.append('totalCost', formData.totalCost);
    formPayload.append('startDate', formData.startDate);
    formPayload.append('completionDate', formData.completionDate);
    formPayload.append('termsAccepted', formData.termsAccepted);
    if (formData.quotationFile) {
      formPayload.append('quotationFile', formData.quotationFile);
    }

    try {
      const response = await fetch('http://localhost:7000/api/submit-quotation', {
        method: 'POST',
        body: formPayload
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit quotation');
      }

      localStorage.removeItem('currentRequestId');
      navigate('/dashboard/requests', { state: { success: 'Quotation submitted successfully!' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quotation-container">
      <div className="quotation-header">
        <h1><FiFileText /> Construction Service Quotation</h1>
        <p className="subtitle">Submit your professional offer to the client</p>
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      <form onSubmit={handleSubmit} className="quotation-form">
        <h2><FiDollarSign /> Quotation Details</h2>

        <div className="form-group">
          <label htmlFor="laborCost"><FiUser /> Labor Cost (₹)</label>
          <input
            type="number"
            id="laborCost"
            name="laborCost"
            value={formData.laborCost}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="materialCost"><FiHome /> Material Cost (₹)</label>
          <input
            type="number"
            id="materialCost"
            name="materialCost"
            value={formData.materialCost}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="otherCost"><FiFileText /> Other Costs (₹)</label>
          <input
            type="number"
            id="otherCost"
            name="otherCost"
            value={formData.otherCost}
            onChange={handleInputChange}
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group total-cost">
          <label><FiDollarSign /> Total Cost (₹)</label>
          <div className="total-cost-value">₹{formData.totalCost || '0.00'}</div>
        </div>

        <div className="form-group">
          <label htmlFor="startDate"><FiCalendar /> Project Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="completionDate"><FiCalendar /> Estimated Completion Date</label>
          <input
            type="date"
            id="completionDate"
            name="completionDate"
            value={formData.completionDate}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group file-upload">
          <label htmlFor="quotationFile"><FiUpload /> Upload Quotation Document (PDF)</label>
          <input
            type="file"
            id="quotationFile"
            name="quotationFile"
            onChange={handleInputChange}
            accept=".pdf"
            required
          />
          {previewUrl && (
            <div className="file-preview">
              <embed src={previewUrl} type="application/pdf" width="100%" height="300px" />
            </div>
          )}
        </div>

        <div className="terms-section">
          <h3><FiFileText /> Terms & Conditions</h3>
          <div className="terms-content">
            <ol>
              <li>The quoted price is valid for 30 days from the date of this quotation.</li>
              <li>A 30% advance payment is required to commence work.</li>
              <li>Any changes to the scope of work may result in additional charges.</li>
              <li>The contractor is responsible for obtaining all necessary permits.</li>
              <li>Work will be performed during standard business hours unless otherwise agreed.</li>
              <li>The contractor carries general liability insurance for the duration of the project.</li>
              <li>Payment terms: 30% advance, 40% at midpoint, 30% upon completion.</li>
              <li>Warranty period: 1 year for workmanship from project completion date.</li>
            </ol>
          </div>
          <div className="terms-acceptance">
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleInputChange}
              required
            />
            <label htmlFor="termsAccepted">
              I accept the terms and conditions outlined above
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="cancel-btn"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !formData.termsAccepted}
          >
            {loading ? 'Submitting...' : <><FiSend /> Submit Quotation</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AcceptRequestPage;
