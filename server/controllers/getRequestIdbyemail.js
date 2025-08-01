const db = require('../config/db'); // Your database connection

const getRequestIdByEmail = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 1. Get client_id from clientsdata
    const [clientRows] = await db.query('SELECT id FROM clientsdata WHERE email = ?', [email]);

    if (clientRows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientId = clientRows[0].id;

    // 2. Get request_ids from service_requests
    const [requestRows] = await db.query(
      'SELECT id AS request_id, request_type, status FROM service_requests WHERE client_id = ?',
      [clientId]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({ message: 'No service requests found for this email' });
    }

    res.json({
      client_id: clientId,
      requests: requestRows
    });
  } catch (error) {
    console.error('Error fetching request ID by email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getRequestIdByEmail
};
