const express = require('express');
const router = express.Router();
const db = require('../config/db');


// Get service request notifications
router.get('/notifications/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    // Get unread notifications/service requests
    const [requests] = await db.query(`
      SELECT sr.id, sr.request_type, sr.status, sr.created_at,
             cf.service_type, cf.location, cf.budget, cf.project_type,
             c.full_name AS client_name, c.email AS client_email,
             ra.is_read
      FROM service_requests sr
      LEFT JOIN construction_forms cf ON sr.construction_form_id = cf.id
      LEFT JOIN clients_profile c ON sr.client_id = c.client_id
      LEFT JOIN request_allocations ra ON sr.id = ra.request_id AND ra.service_provider_id = ?
      WHERE ra.service_provider_id = ? 
      AND ra.allocation_status = 'Pending'
      ORDER BY sr.created_at DESC
      LIMIT 10
    `, [providerId, providerId]);

    res.json({
      success: true,
      data: requests.map(req => ({
        id: req.id,
        type: req.request_type,
        status: req.status,
        serviceType: req.service_type,
        location: req.location,
        budget: req.budget,
        projectType: req.project_type,
        clientName: req.client_name,
        clientEmail: req.client_email,
        createdAt: req.created_at,
        isRead: req.is_read || false
      }))
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.post('/notifications/mark-read/:requestId',  async (req, res) => {
  try {
    const { requestId } = req.params;
    const { providerId } = req.body;

    await db.query(`
      UPDATE request_allocations 
      SET is_read = true 
      WHERE request_id = ? AND service_provider_id = ?
    `, [requestId, providerId]);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

module.exports = router;