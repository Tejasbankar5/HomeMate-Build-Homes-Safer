const db = require('../config/db'); // Assuming you have a database connection setup

const getServiceProviderEarnings = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // First, get the service provider ID from the email
        const [serviceProvider] = await db.query(
            'SELECT id FROM service_providers_authdata WHERE email = ?',
            [email]
        );

        if (!serviceProvider || serviceProvider.length === 0) {
            return res.status(404).json({ error: 'Service provider not found' });
        }

        const serviceProviderId = serviceProvider[0].id;

        // Get all transactions for this service provider
        const [transactions] = await db.query(
            'SELECT * FROM transactions WHERE service_provider_id = ? ORDER BY timestamp DESC',
            [serviceProviderId]
        );

        // Calculate analytics
        const totalEarnings = transactions.reduce((sum, t) => sum + parseFloat(t.net_earnings), 0);
        const totalCommission = transactions.reduce((sum, t) => sum + parseFloat(t.commission), 0);
        const totalTax = transactions.reduce((sum, t) => sum + parseFloat(t.tax), 0);
        
        // Group by payment method
        const paymentMethodStats = transactions.reduce((acc, t) => {
            acc[t.payment_method] = (acc[t.payment_method] || 0) + 1;
            return acc;
        }, {});
        
        // Group by status
        const statusStats = transactions.reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
        }, {});
        
        // Monthly earnings
        const monthlyEarnings = transactions.reduce((acc, t) => {
            const date = new Date(t.timestamp);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[monthYear] = (acc[monthYear] || 0) + parseFloat(t.net_earnings);
            return acc;
        }, {});

        res.json({
            transactions,
            analytics: {
                totalEarnings,
                totalCommission,
                totalTax,
                totalTransactions: transactions.length,
                paymentMethodStats,
                statusStats,
                monthlyEarnings
            }
        });
    } catch (error) {
        console.error('Error fetching earnings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getServiceProviderEarnings
};