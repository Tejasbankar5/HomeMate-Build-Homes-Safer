import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu, FiX, FiHome, FiPieChart, FiCalendar, FiUsers, 
  FiSettings, FiSearch, FiBell, FiChevronDown, FiChevronRight,
  FiMessageSquare, FiMail, FiStar, FiCheck, FiClock, FiUser,
  FiDollarSign, FiBriefcase, FiCheckCircle, FiUserPlus, FiAward, FiFileText,
  FiRefreshCw, FiAlertTriangle, FiDownload, FiFilter, FiExternalLink
} from 'react-icons/fi';
import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Link, useNavigate } from 'react-router-dom';
import './dashboard.css';

ChartJS.register(
  LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, 
  BarElement, ArcElement, Tooltip, Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true); // Changed to true initially
  const [selectedCity, setSelectedCity] = useState('All');
  const [cities, setCities] = useState(['All', 'Nagpur', 'Mumbai', 'Pune', 'Delhi', 'Bangalore']);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState({ url: '', previewUrl: '' });

  const userEmail = localStorage.getItem('email');
  const providerId = localStorage.getItem('providerId');
   
  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 1024) setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!userEmail) {
        setError('Please login to access the dashboard');
        setLoading(false);
        navigate('/login');
        return;
      }
    
      try {
        setLoading(true);
        setError(null);
    
        // First load profile data
        const profileResponse = await fetch(
          `http://localhost:7000/api/dynamic/profile?email=${encodeURIComponent(userEmail)}`
        );
        
        if (!profileResponse.ok) {
          throw new Error('Failed to load profile data');
        }
        
        const profile = await profileResponse.json();
        setProfileData(profile.data || null);

        // Then load verification data
        const verificationResponse = await fetch(
          `http://localhost:7000/api/dynamic/verification?email=${encodeURIComponent(userEmail)}`
        );
        
        if (!verificationResponse.ok) {
          throw new Error('Failed to load verification data');
        }
        
        const verification = await verificationResponse.json();
        setVerificationData(verification.data || null);

        // Then load portfolio data
        const portfolioResponse = await fetch(
          `http://localhost:7000/api/dynamic/portfolio?email=${encodeURIComponent(userEmail)}`
        );
        
        if (!portfolioResponse.ok) {
          throw new Error('Failed to load portfolio data');
        }
        
        const portfolio = await portfolioResponse.json();
        setPortfolioData(portfolio.data || null);

        // Finally load service requests
        await fetchRequestsByCity('All');
        
      } catch (err) {
        console.error('Dashboard initialization error:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    initializeDashboard();
  }, [userEmail, navigate]);

  const fetchRequestsByCity = async (city) => {
    setLoadingRequests(true);
    setError(null);
    try {
      const url = city === 'All' 
        ? 'http://localhost:7000/api/construction/requests'
        : `http://localhost:7000/api/construction/requests?city=${encodeURIComponent(city)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      
      if (data.success) {
        const normalizedRequests = (data.data || []).map(request => ({
          id: request.id || Math.random().toString(36).substr(2, 9),
          project_type: request.project_type || request.projectType || 'Construction Project',
          service_type: request.service_type || request.serviceType || 'Not specified',
          location: request.location || 'Nagpur',
          property_size: request.property_size || request.propertySize || 'Not specified',
          budget: request.budget ? `₹${request.budget}` : '₹20-40 Lakh',
          start_date: request.start_date || request.startDate || new Date().toISOString(),
          end_date: request.end_date || request.endDate || new Date().toISOString(),
          client_name: request.client_name || request.clientName || 'Not specified',
          client_email: request.client_email || request.clientEmail || 'Not specified',
          created_at: request.created_at || request.createdAt || new Date().toISOString(),
          status: request.status || 'Pending'
        }));
        
        setServiceRequests(normalizedRequests);
      } else {
        setError(data.message || 'Failed to fetch requests');
        setServiceRequests([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
      console.error('Fetch requests error:', err);
      setServiceRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    fetchRequestsByCity(city);
  };

  const handleAcceptRequest = async (requestId) => {
    setError(null);
    try {
      localStorage.setItem('currentRequestId', requestId);
      navigate('/accept-request/');
    } catch (error) {
      console.error('Error in handleAcceptRequest:', error);
      setError(error.message || 'Failed to process request');
    }
  };

  const handleViewContract = async (requestId) => {
    setDocumentLoading(true);
    try {
      const response = await fetch(`http://localhost:7000/api/construction/contractdocument/${requestId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch contract');
      }
  
      const data = await response.json();
      
      if (data.success) {
        setCurrentDocument({
          url: data.documentUrl,
          previewUrl: data.previewUrl || data.documentUrl
        });
        setShowDocumentModal(true);
      } else {
        setError(data.message || 'No contract document found');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch contract document');
      console.error('Error fetching document:', err);
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleDownloadContract = () => {
    if (currentDocument.url) {
      window.open(currentDocument.url, '_blank');
    }
  };

  const handleViewDetails = (requestId) => {
    navigate(`/project-details/${requestId}`);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const handleNavigation = (path) => {
    setActiveNav(path);
    if (mobileView) setSidebarOpen(false);
    navigate(`/${path}`);
  };

  const stats = [
    { 
      title: 'Total Earnings', 
      value: '$00', 
      change: 15.2, 
      icon: <FiDollarSign size={20} /> 
    },
    { 
      title: 'Completed Projects', 
      value: serviceRequests.filter(r => r.status === 'Completed').length, 
      change: 8.5, 
      icon: <FiCheckCircle size={20} /> 
    },
    { 
      title: 'Account Verification', 
      value: (verificationData?.aadharVerified || verificationData?.aadhar_verified) ? 'Verified' : 'Pending', 
      change: (verificationData?.aadharVerified || verificationData?.aadhar_verified) ? 100 : 0, 
      icon: (verificationData?.aadharVerified || verificationData?.aadhar_verified) ? <FiCheck size={20} /> : <FiClock size={20} /> 
    },
    { 
      title: 'Active Requests', 
      value: serviceRequests.length, 
      change: serviceRequests.length > 0 ? 10 : 0, 
      icon: <FiBriefcase size={20} /> 
    }
  ];

  if (loading) {
    return (
      <div className={`loading-screen ${darkMode ? 'dark-mode' : ''}`}>
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      <AnimatePresence>
        {(sidebarOpen || !mobileView) && (
          <motion.div 
            className="sidebar"
            initial={{ x: mobileView ? -300 : 0 }}
            animate={{ x: 0 }}
            exit={{ x: mobileView ? -300 : 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="sidebar-header">
              <h2><Link to="/">HomeMate</Link></h2>
              {mobileView && (
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="close-sidebar"
                  aria-label="Close sidebar"
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="user-profile">
              <div className="avatar" aria-label="User avatar">
                {(profileData?.full_name || userEmail || 'SP').charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h4>{profileData?.full_name || userEmail || 'Service Provider'}</h4>
                <p>{profileData?.business_name || 'Independent Professional'}</p>
              </div>
            </div>

            <nav className="sidebar-nav">
              <ul>
                {[
                  { name: 'Dashboard', icon: <FiHome />, id: 'dashboard', path: 'dashboard' },
                  { name: 'Calendar', icon: <FiCalendar />, id: 'calendar', path: 'calender' },
                  { name: 'Messages', icon: <FiMessageSquare />, id: 'messages', path: 'chat' },
                  { name: 'Earnings', icon: <FiDollarSign />, id: 'earnings', path: 'earnings' },
                  { name: 'Settings', icon: <FiSettings />, id: 'settings', path: 'settings' },
                  { name: 'View Accepted requests', id: 'Accepted ', path: 'accepted-contracts' }
                ].map((item) => (
                  <li
                    key={item.id}
                    className={activeNav === item.id ? 'active' : ''}
                    onClick={() => handleNavigation(item.path)}
                  >
                    <motion.div whileHover={{ x: 4 }} className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.name}</span>
                      {item.id === 'projects' && <FiChevronRight className="chevron" />}
                    </motion.div>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="sidebar-footer">
              <button onClick={toggleDarkMode} className="theme-toggle">
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="menu-button"
              aria-label="Toggle sidebar"
            >
              <FiMenu />
            </button>
            <div className="breadcrumbs">
              <Link to="/dashboard">Dashboard</Link>
              <FiChevronRight />
              <span>Overview</span>
            </div>
          </div>

          <div className="header-right">
            <div className={`search-container ${searchOpen ? 'open' : ''}`}>
              <FiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search clients, projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search"
              />
              {searchOpen && (
                <button 
                  onClick={() => setSearchOpen(false)} 
                  className="close-search"
                  aria-label="Close search"
                >
                  <FiX />
                </button>
              )}
            </div>
            {!searchOpen && (
              <button 
                onClick={() => setSearchOpen(true)} 
                className="search-button mobile-only"
                aria-label="Open search"
              >
                <FiSearch />
              </button>
            )}

            <div className="user-dropdown">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="user-button"
                aria-label="User menu"
                aria-expanded={userDropdownOpen}
              >
                <div className="user-avatar">
                  {(profileData?.full_name || userEmail || 'SP').charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{profileData?.full_name || userEmail || 'Service Provider'}</span>
                <FiChevronDown className={`chevron ${userDropdownOpen ? 'open' : ''}`} />
              </button>
              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div 
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Link to="/viewprofile" onClick={() => setUserDropdownOpen(false)}>
                      <FiUser /> Profile
                    </Link>
                    <Link to="/settings" onClick={() => setUserDropdownOpen(false)}>
                      <FiSettings /> Settings
                    </Link>
                    <Link to="/earnings" onClick={() => setUserDropdownOpen(false)}>
                      <FiDollarSign /> Earnings
                    </Link>
                    <button 
                      onClick={() => {
                        setUserDropdownOpen(false);
                        localStorage.removeItem('email');
                        localStorage.removeItem('providerId');
                        navigate('/login');
                      }}
                      className="logout-btn"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <section className="stats-section">
            <motion.div 
              className="stats-grid"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
                hidden: {}
              }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="stat-card"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: { type: 'spring', stiffness: 300 }
                    }
                  }}
                  whileHover={{ y: -5 }}
                >
                  <div className="stat-header">
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-info">
                      <h3>{stat.value}</h3>
                      <p>{stat.title}</p>
                    </div>
                  </div>
                  <div className={`stat-change ${stat.change >= 0 ? 'positive' : 'negative'}`}>
                    {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}%
                    <span> vs last month</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>

          <section className="requests-section">
            <div className="section-header">
              <h3>Construction Service Requests</h3>
              <div className="header-actions">
                <div className="city-filter">
                  <label htmlFor="city-select">Filter by City:</label>
                  <select
                    id="city-select"
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={loadingRequests}
                  >
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <button 
                  className="refresh-btn" 
                  onClick={() => fetchRequestsByCity(selectedCity)}
                  disabled={loadingRequests}
                >
                  <FiRefreshCw /> {loadingRequests ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="error-message">
                <FiAlertTriangle /> {error}
                <button onClick={() => setError(null)} className="dismiss-error">
                  Dismiss
                </button>
              </div>
            )}
            
            <div className="requests-grid">
              {loadingRequests ? (
                <div className="loading-requests">
                  <div className="spinner"></div>
                  <p>Loading service requests...</p>
                </div>
              ) : serviceRequests.length === 0 ? (
                <div className="no-requests">
                  <FiRefreshCw className="icon" />
                  <p>No construction requests available</p>
                  <button 
                    onClick={() => fetchRequestsByCity(selectedCity)} 
                    className="retry-btn"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                serviceRequests.map((request, index) => (
                  <motion.div 
                    key={request.id} 
                    className="request-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="request-header">
                      <h4>{request.project_type}</h4>
                      <span className={`status ${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="request-details">
                      <p><strong>Service Type:</strong> {request.service_type}</p>
                      <p><strong>Location:</strong> {request.location}</p>
                      <p><strong>Property Size:</strong> {request.property_size} sq.ft</p>
                      <p><strong>Budget:</strong> {request.budget}</p>
                      <p><strong>Timeline:</strong> 
                        {new Date(request.start_date).toLocaleDateString()} to{' '}
                        {new Date(request.end_date).toLocaleDateString()}
                      </p>
                      <p><strong>Client:</strong> {request.client_name} ({request.client_email})</p>
                      <p><strong>Posted:</strong> {new Date(request.created_at).toLocaleString()}</p>
                    </div>
                    <div className="request-actions">
                      {request.status === 'Pending' && (
                        <button 
                          onClick={() => handleAcceptRequest(request.id)}
                          className="accept-btn"
                          disabled={documentLoading}
                        >
                          <FiCheck /> Accept Request
                        </button>
                      )}
                      <button
                        onClick={() => handleViewContract(request.id)}
                        className="details-btn"
                        disabled={documentLoading}
                      >
                        {documentLoading ? 'Loading...' : (
                          <>
                            <FiFileText /> View Contract
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Document Preview Modal */}
          {showDocumentModal && (
            <div className="document-modal-overlay">
              <div className="document-modal">
                <div className="modal-header">
                  <h3>Contract Document</h3>
                  <button 
                    onClick={() => setShowDocumentModal(false)}
                    className="close-modal"
                  >
                    <FiX />
                  </button>
                </div>
                <div className="modal-content">
                  {currentDocument.previewUrl ? (
                    <>
                      <iframe 
                        src={currentDocument.previewUrl}
                        title="Contract Document Preview"
                        width="100%"
                        height="500px"
                        frameBorder="0"
                      />
                      <div className="modal-actions">
                        <button 
                          onClick={handleDownloadContract}
                          className="download-btn"
                        >
                          <FiDownload /> Download Document
                        </button>
                        <a 
                          href={currentDocument.previewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="external-link"
                        >
                          <FiExternalLink /> Open in New Tab
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="no-preview">
                      <FiAlertTriangle size={24} />
                      <p>Document preview not available</p>
                      <button 
                        onClick={handleDownloadContract}
                        className="download-btn"
                      >
                        <FiDownload /> Download Document
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <section className="charts-section">
            <div className="chart-container">
              <h3>Monthly Earnings</h3>
              <div className="chart-wrapper">
                <Line 
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                      label: 'Monthly Earnings ($)',
                      data: [0, 0, 0, 120000, 0, 0],
                      borderColor: '#1a73e8',
                      backgroundColor: 'rgba(26, 115, 232, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  }} 
                  options={{ 
                    responsive: true,
                    plugins: { 
                      legend: { position: 'top' },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `$${context.raw.toLocaleString()}`;
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
            <div className="chart-container">
              <h3>Service Distribution</h3>
              <div className="chart-wrapper">
                <Bar 
                  data={{
                    labels: ['Architecture', 'Construction', 'Electrical', 'Plumbing', 'Other'],
                    datasets: [{
                      label: 'Service Distribution',
                      data: [1, 10, 0, 1, 2],
                      backgroundColor: [
                        'rgba(26, 115, 232, 0.8)',
                        'rgba(66, 133, 244, 0.8)',
                        'rgba(251, 188, 4, 0.8)',
                        'rgba(234, 67, 53, 0.8)',
                        'rgba(52, 168, 83, 0.8)'
                      ],
                      borderColor: [
                        'rgba(26, 115, 232, 1)',
                        'rgba(66, 133, 244, 1)',
                        'rgba(251, 188, 4, 1)',
                        'rgba(234, 67, 53, 1)',
                        'rgba(52, 168, 83, 1)'
                      ],
                      borderWidth: 1
                    }]
                  }} 
                  options={{ 
                    responsive: true,
                    plugins: { legend: { position: 'top' } }
                  }} 
                />
              </div>
            </div>
            <div className="chart-container">
              <h3>Request Status</h3>
              <div className="chart-wrapper">
                <Pie 
                  data={{
                    labels: ['Completed', 'In Progress', 'Pending', 'Rejected'],
                    datasets: [{
                      data: [
                        serviceRequests.filter(r => r.status === 'Completed').length,
                        serviceRequests.filter(r => r.status === 'In Progress').length,
                        serviceRequests.filter(r => r.status === 'Pending').length,
                        serviceRequests.filter(r => r.status === 'Rejected').length
                      ],
                      backgroundColor: [
                        'rgba(52, 168, 83, 0.8)',
                        'rgba(26, 115, 232, 0.8)',
                        'rgba(251, 188, 4, 0.8)',
                        'rgba(234, 67, 53, 0.8)'
                      ],
                      borderColor: [
                        'rgba(52, 168, 83, 1)',
                        'rgba(26, 115, 232, 1)',
                        'rgba(251, 188, 4, 1)',
                        'rgba(234, 67, 53, 1)'
                      ],
                      borderWidth: 1
                    }]
                  }} 
                  options={{ 
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                  }} 
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;