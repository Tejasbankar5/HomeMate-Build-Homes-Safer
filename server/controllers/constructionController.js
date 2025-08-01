const db = require('../config/db');
const { google } = require('googleapis');

// Helper function to extract Google Drive file ID
const extractGoogleDriveFileId = (url) => {
  const match = url.match(/\/file\/d\/([^\/]+)/);
  return match ? match[1] : null;
};

exports.getConstructionRequests = async (req, res) => {
  try {
    const { city } = req.query;
    const DEFAULT_LIMIT = 3;

    // Solution 1: Include all non-aggregated columns in GROUP BY
    let query = `
      SELECT 
        sr.id, 
        sr.request_type, 
        sr.status, 
        sr.created_at,
        cf.service_type, 
        cf.location, 
        cf.budget, 
        cf.project_type, 
        cf.property_size, 
        cf.start_date, 
        cf.end_date,
        cd.email AS client_email,
        cp.full_name AS client_name
      FROM service_requests sr
      INNER JOIN construction_forms cf ON sr.construction_form_id = cf.id
      INNER JOIN clientsdata cd ON sr.client_id = cd.id
      INNER JOIN clients_profile cp ON cd.id = cp.client_id
      WHERE sr.request_type = 'Construction'
      AND sr.status = 'Pending'
    `;

    if (city && city !== 'All') {
      query += ` AND cf.location LIKE ?`;
    }

    // Include all selected columns in GROUP BY
    query += `
      GROUP BY 
        sr.id, 
        sr.request_type, 
        sr.status, 
        sr.created_at,
        cf.service_type, 
        cf.location, 
        cf.budget, 
        cf.project_type, 
        cf.property_size, 
        cf.start_date, 
        cf.end_date,
        cd.email,
        cp.full_name
      ORDER BY sr.created_at DESC 
      LIMIT ?
    `;

    const queryParams = [];
    if (city && city !== 'All') {
      queryParams.push(`%${city}%`);
    }
    queryParams.push(DEFAULT_LIMIT);

    const [requests] = await db.query(query, queryParams);
    
    // Alternative Solution 2: Use subquery to avoid GROUP BY issues
    /*
    const [requests] = await db.query(`
      SELECT * FROM (
        SELECT DISTINCT
          sr.id, sr.request_type, sr.status, sr.created_at,
          cf.service_type, cf.location, cf.budget, cf.project_type, 
          cf.property_size, cf.start_date, cf.end_date,
          cd.email AS client_email,
          cp.full_name AS client_name
        FROM service_requests sr
        INNER JOIN construction_forms cf ON sr.construction_form_id = cf.id
        INNER JOIN clientsdata cd ON sr.client_id = cd.id
        INNER JOIN clients_profile cp ON cd.id = cp.client_id
        WHERE sr.request_type = 'Construction'
        AND sr.status = 'Pending'
        ${city && city !== 'All' ? 'AND cf.location LIKE ?' : ''}
      ) AS distinct_requests
      ORDER BY created_at DESC 
      LIMIT ?
    `, city && city !== 'All' ? [`%${city}%`, DEFAULT_LIMIT] : [DEFAULT_LIMIT]);
    */

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching construction requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getContractDocument = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Verify request exists
    const [request] = await db.query(
      `SELECT id FROM service_requests WHERE id = ?`, 
      [requestId]
    );
    
    if (request.length === 0) {
      return res.status(404).json({ // Always return JSON
        success: false,
        message: 'Request not found'
      });
    }

    // Check for documents
    const [documents] = await db.query(
      `SELECT document_url FROM contract_documents WHERE request_id = ?`,
      [requestId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ // Always return JSON
        success: false,
        message: 'No document found for this request'
      });
    }

    res.status(200).json({
      success: true,
      documentUrl: documents[0].document_url,
      previewUrl: documents[0].document_url // Same URL if no preview available
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ // Always return JSON error
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
exports.acceptConstructionRequest = async (req, res) => {
  const { requestId, providerId } = req.body;
  
  if (!requestId || !providerId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  try {
    await db.beginTransaction();
    
    const [request] = await db.query(
      `SELECT id, client_id FROM service_requests 
       WHERE id = ? AND status = 'Pending' 
       AND request_type = 'Construction'`,
      [requestId]
    );

    if (request.length === 0) {
      await db.rollback();
      return res.status(404).json({
        success: false,
        message: 'Request not found or already processed'
      });
    }

    const clientId = request[0].client_id;
    
    await db.query(
      `UPDATE service_requests SET status = 'Allocated' WHERE id = ?`, 
      [requestId]
    );
    
    await db.query(
      `INSERT INTO request_allocations 
       (request_id, service_provider_id, allocation_status)
       VALUES (?, ?, 'Pending')`,
      [requestId, providerId]
    );
    
    await db.query(
      `INSERT INTO notifications 
       (user_id, user_type, request_id, message, type)
       VALUES (?, 'client', ?, 'Your construction request has been accepted by a service provider', 'status_update')`,
      [clientId, requestId]
    );
    
    await db.commit();
    
    res.status(200).json({
      success: true,
      message: 'Request accepted successfully'
    });
  } catch (error) {
    await db.rollback();
    console.error('Error accepting request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept request',
      error: error.message
    });
  }
};