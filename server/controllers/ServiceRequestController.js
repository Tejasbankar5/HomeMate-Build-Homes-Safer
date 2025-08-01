const db = require('../config/db');

// Debug database connection
console.log('[DEBUG] Database connection established:', !!db);

/**
 * Get service requests for provider
 */
const getServiceRequests = async (req, res) => {
    console.log('[DEBUG] getServiceRequests triggered');
    
    try {
        // 1. Validate provider exists
        const [providerProfile] = await db.query(
            `SELECT services_offered 
             FROM service_provider_profiles 
             WHERE service_provider_id = ?`,
            [req.user.id]
        );

        if (!providerProfile.length) {
            console.log('[DEBUG] Provider profile not found');
            return res.status(404).json({ 
                success: false,
                message: 'Provider profile not found' 
            });
        }

        // 2. Parse services
        const servicesOffered = providerProfile[0].services_offered;
        if (!servicesOffered) {
            return res.status(400).json({
                success: false,
                message: 'No services configured for provider'
            });
        }

        const serviceTypes = servicesOffered.split(',').map(s => s.trim());
        console.log('[DEBUG] Provider services:', serviceTypes);

        // 3. Get matching requests
        const [requests] = await db.query(
            `SELECT 
                sr.id as requestId,
                sr.request_type as serviceType,
                cf.location,
                cf.budget,
                cf.document_path as documentUrl,
                sr.created_at as createdAt,
                c.email as clientEmail,
                sr.status
             FROM service_requests sr
             LEFT JOIN construction_forms cf ON sr.construction_form_id = cf.id
             JOIN clientsdata c ON sr.client_id = c.id
             WHERE sr.status = 'Pending'
             AND sr.request_type IN (?)
             ORDER BY sr.created_at DESC`,
            [serviceTypes]
        );

        console.log(`[DEBUG] Found ${requests.length} matching requests`);

        res.json({
            success: true,
            requests: requests.map(req => ({
                requestId: req.requestId,
                serviceType: req.serviceType,
                location: req.location || 'Not specified',
                budget: req.budget || 'Not specified',
                documentUrl: req.documentUrl,
                createdAt: req.createdAt,
                status: req.status,
                clientDetails: { email: req.clientEmail }
            }))
        });

    } catch (error) {
        console.error('[ERROR] getServiceRequests failed:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch service requests',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Accept service request
 */
const acceptServiceRequest = async (req, res) => {
    console.log('[DEBUG] acceptServiceRequest triggered with:', req.body);
    
    try {
        const { requestId } = req.body;
        const providerId = req.user.id;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Verify request exists and is pending
            const [request] = await connection.query(
                `SELECT id, client_id 
                 FROM service_requests 
                 WHERE id = ? AND status = 'Pending'
                 FOR UPDATE`,
                [requestId]
            );

            if (!request.length) {
                await connection.rollback();
                console.log('[DEBUG] Request not available for acceptance');
                return res.status(404).json({ 
                    success: false,
                    message: 'Request not available for acceptance' 
                });
            }

            // 2. Create allocation
            await connection.query(
                `INSERT INTO request_allocations 
                 (request_id, service_provider_id, allocation_status)
                 VALUES (?, ?, 'Pending')`,
                [requestId, providerId]
            );

            // 3. Update request status
            await connection.query(
                `UPDATE service_requests 
                 SET status = 'Allocated' 
                 WHERE id = ?`,
                [requestId]
            );

            // 4. Create notification
            const [client] = await connection.query(
                `SELECT email FROM clientsdata WHERE id = ?`,
                [request[0].client_id]
            );

            if (client.length > 0) {
                await connection.query(
                    `INSERT INTO notifications 
                     (user_id, user_type, request_id, message, type)
                     VALUES (?, 'client', ?, 'A provider has accepted your request', 'status_update')`,
                    [request[0].client_id, requestId]
                );

                if (req.io) {
                    req.io.emit(`client_${client[0].email}`, {
                        type: 'request_accepted',
                        requestId,
                        message: 'Your request has been accepted by a provider'
                    });
                }
            }

            await connection.commit();
            console.log('[DEBUG] Request accepted successfully');
            res.json({ 
                success: true,
                message: 'Request accepted successfully' 
            });

        } catch (error) {
            await connection.rollback();
            console.error('[ERROR] Transaction failed:', error);
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('[ERROR] acceptServiceRequest failed:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to accept request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getServiceRequests,
    acceptServiceRequest
};