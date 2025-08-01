import React, { useState, useEffect, useRef } from 'react';
import './accept.css';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SignaturePad from 'react-signature-pad-wrapper';

const AcceptedContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const signatureRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const providerEmail = localStorage.getItem('email');
        
        if (!providerEmail) {
          toast.error('Please login first');
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:7000/api/accepted', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: providerEmail }),
        });

        const data = await response.json();
        if (response.ok) {
          setContracts(data.contracts);
        } else {
          toast.error(data.message || 'Failed to fetch contracts');
        }
      } catch (error) {
        toast.error('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [navigate]);

  const handleGenerateContract = (contract) => {
    setSelectedContract(contract);
    setShowContractModal(true);
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleSignContract = async () => {
    if (!selectedContract) {
      toast.error('No contract selected');
      return;
    }

    const signaturePad = signatureRef.current?.signaturePad;
    if (!signaturePad || signaturePad.isEmpty()) {
      toast.error('Please provide your signature');
      return;
    }

    setIsSigning(true);

    try {
      const signatureData = signaturePad.toDataURL();

      const response = await fetch('http://localhost:7000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation_id: selectedContract.quotation_id,
          signature: signatureData,
          provider_id: selectedContract.provider_id,
          client_id: selectedContract.client_id
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Contract signed successfully!');
        setContracts(contracts.map(c => 
          c.quotation_id === selectedContract.quotation_id 
            ? {...c, status: 'signed', contract_url: data.contract_path} 
            : c
        ));
        setShowContractModal(false);
      } else {
        throw new Error(data.message || 'Signing failed');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSigning(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your contracts...</p>
      </div>
    );
  }

  return (
    <div className="contracts-container">
      <ToastContainer position="top-right" autoClose={5000} />
      <h1 className="contracts-header">Accepted Contracts</h1>
      
      {contracts.length === 0 ? (
        <div className="no-contracts">
          <img src="/images/no-contracts.svg" alt="No contracts" />
          <p>No accepted contracts found.</p>
        </div>
      ) : (
        <div className="contracts-grid">
          {contracts.map((contract) => (
            <div key={contract.quotation_id} className="contract-card">
              <div className="contract-header">
                <h3>Contract #{contract.quotation_id}</h3>
                <span className={`status-badge ${contract.status}`}>
                  {contract.status}
                </span>
              </div>
              <div className="contract-details">
                <p><strong>Client:</strong> {contract.client_email}</p>
                <p><strong>Service:</strong> {contract.request_type}</p>
                <p><strong>Total Cost:</strong> rs{contract.total_cost.toFixed(2)}</p>
                <p><strong>Start Date:</strong> {formatDate(contract.start_date)}</p>
                <p><strong>Completion Date:</strong> {formatDate(contract.completion_date)}</p>
              </div>
              <div className="contract-actions">
                {contract.status === 'accepted' && (
                  <button 
                    onClick={() => handleGenerateContract(contract)}
                    className="btn-primary"
                  >
                    Sign Digital Contract
                  </button>
                )}
                {contract.contract_url && (
                  <a 
                    href={`http://localhost:7000/api/contracts/download/${contract.contract_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    View Contract
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showContractModal && selectedContract && (
        <div className="modal-overlay">
          <div className="contract-modal">
            <button 
              className="close-modal" 
              onClick={() => setShowContractModal(false)}
            >
              &times;
            </button>
            
            <h2>Digital Contract Agreement</h2>
            <div className="contract-content">
              <div className="contract-terms">
                <h3>Contract Terms</h3>
                <p><strong>Service:</strong> {selectedContract.request_type}</p>
                <p><strong>Client:</strong> {selectedContract.client_email}</p>
                <p><strong>Total Amount:</strong> rs{selectedContract.total_cost.toFixed(2)}</p>
                <p><strong>Start Date:</strong> {formatDate(selectedContract.start_date)}</p>
                <p><strong>Completion Date:</strong> {formatDate(selectedContract.completion_date)}</p>
                
                <h4>Payment Milestones:</h4>
                <ul className="milestones-list">
                  <li>30% upfront payment upon signing</li>
                  <li>40% after project midpoint</li>
                  <li>30% upon completion and client approval</li>
                </ul>
                
                <h4>Terms & Conditions:</h4>
                <ol>
                  <li>The contractor agrees to complete the work as specified.</li>
                  <li>The client agrees to make payments according to the milestones.</li>
                  <li>Any changes to scope must be agreed in writing by both parties.</li>
                  <li>The contractor will provide regular progress updates.</li>
                  <li>All disputes will be resolved through mutual discussion.</li>
                  <li>The contractor maintains liability for workmanship for 1 year post-completion.</li>
                </ol>
              </div>
              
              <div className="signature-section">
                <h3>Provider Signature</h3>
                <div className="signature-container">
                  <SignaturePad
                    ref={signatureRef}
                    options={{
                      penColor: 'black',
                      backgroundColor: 'rgb(240, 240, 240)'
                    }}
                    width={500}
                    height={200}
                  />
                </div>
                <button 
                  onClick={handleClearSignature}
                  className="btn-clear"
                >
                  Clear Signature
                </button>
                <p className="signature-note">
                  By clicking "Sign Contract", you agree to all terms and conditions outlined above.
                </p>
                <div className="signature-actions">
                  <button 
                    onClick={handleSignContract} 
                    className="btn-primary"
                    disabled={isSigning}
                  >
                    {isSigning ? 'Processing...' : 'Sign Contract'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptedContracts;