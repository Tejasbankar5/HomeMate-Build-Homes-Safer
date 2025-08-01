const pool = require('../config/db');

const DynamicController = {
  getProfile: async (req, res) => {
    console.log('getProfile called');
    try {
      const { email } = req.query;
      console.log('Fetching profile for email:', email);
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email parameter is required'
        });
      }

      // Get the service provider ID from the email
      const [providerRows] = await pool.query(`
        SELECT id FROM service_providers_authdata WHERE email = ?
      `, [email]);

      if (providerRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service provider not found'
        });
      }

      const service_provider_id = providerRows[0].id;
      
      // Get profile with verification counts
      const [profileRows] = await pool.query(`
        SELECT p.*, 
               (SELECT COUNT(*) FROM aadhaar_verifications 
                WHERE service_provider_id = p.service_provider_id 
                AND verification_status = 'verified') AS aadhaar_verified,
               (SELECT COUNT(*) FROM portfolio_verifications 
                WHERE service_provider_id = p.service_provider_id
                AND verification_status = 'verified') AS portfolio_verified
        FROM service_provider_profiles p
        WHERE p.service_provider_id = ?
      `, [service_provider_id]);

      console.log('Profile query results:', profileRows);

      if (profileRows.length === 0) {
        console.log('No profile found for provider ID:', service_provider_id);
        return res.status(404).json({ 
          success: false,
          message: 'Profile not found',
          data: null
        });
      }

      const profileData = {
        ...profileRows[0],
        aadhaar_verified: profileRows[0].aadhaar_verified > 0,
        portfolio_verified: profileRows[0].portfolio_verified > 0
      };

      console.log('Returning profile data');
      res.json({
        success: true,
        data: profileData
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while fetching profile',
        error: error.message
      });
    }
  },

  getVerificationStatus: async (req, res) => {
    console.log('getVerificationStatus called');
    try {
      const { email } = req.query;
      console.log('Fetching verification for email:', email);
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email parameter is required'
        });
      }
  
      // Get service provider ID from email
      const [providerRows] = await pool.query(`
        SELECT id FROM service_providers_authdata WHERE email = ?
      `, [email]);
  
      if (providerRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service provider not found'
        });
      }
  
      const service_provider_id = providerRows[0].id;
      
      // Get verification status
      const [aadhaarRows] = await pool.query(`
        SELECT 
          id,
          CASE 
            WHEN verification_status = 'verified' THEN true
            ELSE false
          END as is_verified,
          uploaded_at as last_updated
        FROM aadhaar_verifications 
        WHERE service_provider_id = ?
        ORDER BY uploaded_at DESC
        LIMIT 1
      `, [service_provider_id]);
  
      const [portfolioRows] = await pool.query(`
        SELECT 
          id,
          CASE 
            WHEN verification_status = 'verified' THEN true
            ELSE false
          END as is_verified,
          submitted_at as last_updated
        FROM portfolio_verifications 
        WHERE service_provider_id = ?
        ORDER BY submitted_at DESC
        LIMIT 1
      `, [service_provider_id]);
  
      console.log('Verification query results:', {
        aadhaar: aadhaarRows,
        portfolio: portfolioRows
      });
  
      // Prepare response
      const response = {
        success: true,
        data: {
          aadhaar_verified: aadhaarRows.length > 0 ? aadhaarRows[0].is_verified : false,
          portfolio_verified: portfolioRows.length > 0 ? portfolioRows[0].is_verified : false,
          aadhaar_status: aadhaarRows.length > 0 ? 
            (aadhaarRows[0].is_verified ? 'verified' : 'pending') : 'not_submitted',
          portfolio_status: portfolioRows.length > 0 ? 
            (portfolioRows[0].is_verified ? 'verified' : 'pending') : 'not_submitted',
          last_updated: {
            aadhaar: aadhaarRows.length > 0 ? aadhaarRows[0].last_updated : null,
            portfolio: portfolioRows.length > 0 ? portfolioRows[0].last_updated : null
          }
        }
      };
  
      console.log('Returning verification status:', response);
      res.json(response);
    } catch (error) {
      console.error('Error in getVerificationStatus:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while fetching verification status',
        error: error.message
      });
    }
  },

  getPortfolioData: async (req, res) => {
    console.log('getPortfolioData called');
    try {
      const { email } = req.query;
      console.log('Fetching portfolio for email:', email);
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email parameter is required'
        });
      }

      // Get service provider ID from email
      const [providerRows] = await pool.query(`
        SELECT id FROM service_providers_authdata WHERE email = ?
      `, [email]);

      if (providerRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service provider not found'
        });
      }

      const service_provider_id = providerRows[0].id;
      
      // Get portfolio data
      const [portfolioRows] = await pool.query(`
        SELECT * FROM portfolio_verifications 
        WHERE service_provider_id = ?
        ORDER BY submitted_at DESC
        LIMIT 1
      `, [service_provider_id]);

      console.log('Portfolio query results:', portfolioRows);

      if (portfolioRows.length === 0) {
        console.log('No portfolio found for provider ID:', service_provider_id);
        return res.json({
          success: true,
          data: null,
          message: 'No portfolio data found'
        });
      }

      const portfolio = portfolioRows[0];
      const portfolioData = {
        ...portfolio,
        portfolioLinks: portfolio.portfolioLinks ? 
          portfolio.portfolioLinks.split(',').filter(link => link.trim() !== '') : 
          [],
        expertiseAreas: portfolio.expertiseAreas || 'Not specified',
        experienceYears: portfolio.experienceYears || 0,
        verified: portfolio.verification_status === 'verified'
      };

      console.log('Returning portfolio data');
      res.json({
        success: true,
        data: portfolioData
      });
    } catch (error) {
      console.error('Error in getPortfolioData:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while fetching portfolio',
        error: error.message
      });
    }
  },

  getServiceRequests: async (req, res) => {
    console.log('getServiceRequests called');
    try {
      const { email, city, limit } = req.query;
      console.log('Fetching requests for email:', email);
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email parameter is required'
        });
      }
  
      // Get service provider ID from email
      const [providerRows] = await pool.query(`
        SELECT id FROM service_providers_authdata WHERE email = ?
      `, [email]);
  
      if (providerRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service provider not found'
        });
      }
  
      const service_provider_id = providerRows[0].id;
      
      // Build base query
      let query = `
        SELECT DISTINCT
          r.id, 
          r.request_type, 
          r.status, 
          r.created_at,
          cd.location, 
          cd.budget, 
          cd.service_type,
          ra.allocation_status
        FROM service_requests r
        JOIN request_allocations ra ON r.id = ra.request_id
        JOIN clientsdata cd ON r.client_id = cd.id
        WHERE ra.service_provider_id = ?
      `;
  
      const params = [service_provider_id];
  
      // Add city filter if provided
      if (city && city !== 'All') {
        query += ' AND cd.location = ?';
        params.push(city);
      }
  
      // Add sorting and limit
      query += ' ORDER BY r.created_at DESC';
      
      if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit));
      }
  
      const [requests] = await pool.query(query, params);
  
      console.log('Service requests query results:', requests);
  
      const formattedRequests = requests.map(request => ({
        id: request.id,
        requestId: request.id,
        serviceType: request.service_type || request.request_type,
        status: request.allocation_status || request.status,
        location: request.location,
        budget: request.budget,
        createdAt: request.created_at
      }));
  
      console.log('Returning formatted requests');
      res.json({
        success: true,
        data: formattedRequests
      });
    } catch (error) {
      console.error('Error in getServiceRequests:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while fetching requests',
        error: error.message
      });
    }
  },

  acceptServiceRequest: async (req, res) => {
    console.log('acceptServiceRequest called');
    try {
      const { email, requestId } = req.body;
      
      if (!email || !requestId) {
        return res.status(400).json({
          success: false,
          message: 'Email and requestId are required'
        });
      }

      // Get service provider ID from email
      const [providerRows] = await pool.query(`
        SELECT id FROM service_providers_authdata WHERE email = ?
      `, [email]);

      if (providerRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service provider not found'
        });
      }

      const service_provider_id = providerRows[0].id;

      // Update allocation status
      const [updateResult] = await pool.query(`
        UPDATE request_allocations 
        SET allocation_status = 'Accepted'
        WHERE request_id = ? AND service_provider_id = ?
      `, [requestId, service_provider_id]);

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Request not found or already processed'
        });
      }

      res.json({
        success: true,
        message: 'Request accepted successfully'
      });
    } catch (error) {
      console.error('Error in acceptServiceRequest:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error while accepting request',
        error: error.message
      });
    }
  }
};

module.exports = DynamicController;