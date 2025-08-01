const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticate = async (req, res, next) => {
    console.log('Authentication middleware triggered');
    console.log('Headers:', req.headers);
    
    try {
        let token = req.headers.authorization;
        
        if (!token) {
            console.error('No authorization header found');
            return res.status(401).json({ 
                success: false, 
                message: 'Authorization token required' 
            });
        }

        // Remove 'Bearer ' prefix if present
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }

        console.log('Token before verification:', token);
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        
        if (!decoded.email) {
            console.error('Token missing email');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format' 
            });
        }

        // Check if provider exists
        const [provider] = await pool.query(
            'SELECT id, email FROM service_providers_authdata WHERE email = ?', 
            [decoded.email]
        );

        console.log('Database query results:', provider);

        if (provider.length === 0) {
            console.error('No provider found with email:', decoded.email);
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Attach provider to request
        req.provider = {
            id: provider[0].id,
            email: provider[0].email
        };

        console.log('Authentication successful for:', provider[0].email);
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        let message = 'Authentication failed';
        if (error.name === 'TokenExpiredError') {
            message = 'Token expired';
        } else if (error.name === 'JsonWebTokenError') {
            message = 'Invalid token';
        }

        res.status(401).json({ 
            success: false, 
            message,
            error: error.message 
        });
    }
};

module.exports = authenticate;