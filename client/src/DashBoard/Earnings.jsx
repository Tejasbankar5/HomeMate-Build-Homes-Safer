import React, { useState, useEffect } from 'react';
import './earnings.css';

const EarningsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('all');

    useEffect(() => {
        const fetchEarningsData = async () => {
            try {
                const email = localStorage.getItem('email');
                if (!email) {
                    throw new Error('No email found in local storage');
                }

                const response = await fetch('http://localhost:7000/api/earnings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch earnings data');
                }

                const data = await response.json();
                setTransactions(data.transactions);
                setAnalytics(data.analytics);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchEarningsData();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading your earnings data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">!</div>
                <h3>Error Loading Data</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="no-data">
                <h3>No earnings data found</h3>
                <p>You don't have any transactions yet.</p>
            </div>
        );
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    const renderOverviewTab = () => (
        <div className="overview-tab">
            <div className="stats-grid">
                <div className="stat-card primary">
                    <h3>Total Earnings</h3>
                    <p>{formatCurrency(analytics.totalEarnings)}</p>
                    <div className="stat-trend up">↑ 12% from last month</div>
                </div>
                <div className="stat-card secondary">
                    <h3>Total Transactions</h3>
                    <p>{analytics.totalTransactions}</p>
                    <div className="stat-trend up">↑ 8% from last month</div>
                </div>
                <div className="stat-card tertiary">
                    <h3>Commission Paid</h3>
                    <p>{formatCurrency(analytics.totalCommission)}</p>
                    <div className="stat-trend down">↓ 2% from last month</div>
                </div>
                <div className="stat-card quaternary">
                    <h3>Tax Paid</h3>
                    <p>{formatCurrency(analytics.totalTax)}</p>
                    <div className="stat-trend up">↑ 5% from last month</div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-card">
                    <h3>Monthly Earnings</h3>
                    <div className="bar-chart">
                        {Object.entries(analytics.monthlyEarnings).map(([month, amount]) => (
                            <div key={month} className="bar-container">
                                <div 
                                    className="bar" 
                                    style={{ height: `${(amount / analytics.totalEarnings) * 100}%` }}
                                ></div>
                                <span className="bar-label">{month}</span>
                                <span className="bar-value">{formatCurrency(amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="chart-card pie-chart-container">
                    <h3>Payment Methods</h3>
                    <div className="pie-chart">
                        {Object.entries(analytics.paymentMethodStats).map(([method, count], index) => {
                            const percentage = (count / analytics.totalTransactions) * 100;
                            const color = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'][index % 5];
                            return (
                                <div 
                                    key={method}
                                    className="pie-slice"
                                    style={{
                                        '--percentage': `${percentage}%`,
                                        '--color': color,
                                        '--offset': index === 0 ? 0 : 
                                            Object.values(analytics.paymentMethodStats)
                                                .slice(0, index)
                                                .reduce((a, b) => a + (b / analytics.totalTransactions) * 100, 0)
                                    }}
                                ></div>
                            );
                        })}
                    </div>
                    <div className="pie-legend">
                        {Object.entries(analytics.paymentMethodStats).map(([method, count], index) => {
                            const color = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'][index % 5];
                            return (
                                <div key={method} className="legend-item">
                                    <span className="legend-color" style={{ backgroundColor: color }}></span>
                                    <span className="legend-label">{method}</span>
                                    <span className="legend-value">{count} ({Math.round((count / analytics.totalTransactions) * 100)}%)</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTransactionsTab = () => (
        <div className="transactions-tab">
            <div className="filters">
                <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="time-filter"
                >
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="week">This Week</option>
                    <option value="today">Today</option>
                </select>
            </div>
            
            <div className="transactions-list">
                {transactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-card">
                        <div className="transaction-header">
                            <span className="transaction-id">#{transaction.transaction_id}</span>
                            <span className={`transaction-status ${transaction.status.toLowerCase()}`}>
                                {transaction.status}
                            </span>
                        </div>
                        <div className="transaction-details">
                            <div className="detail-group">
                                <span className="detail-label">Amount</span>
                                <span className="detail-value">{formatCurrency(transaction.amount)}</span>
                            </div>
                            <div className="detail-group">
                                <span className="detail-label">Net Earnings</span>
                                <span className="detail-value earnings">{formatCurrency(transaction.net_earnings)}</span>
                            </div>
                            <div className="detail-group">
                                <span className="detail-label">Payment Method</span>
                                <span className="detail-value">{transaction.payment_method}</span>
                            </div>
                            <div className="detail-group">
                                <span className="detail-label">Date</span>
                                <span className="detail-value">{formatDate(transaction.timestamp)}</span>
                            </div>
                        </div>
                        <div className="transaction-footer">
                            <span className="service-rendered">{transaction.service_rendered}</span>
                            {transaction.invoice_link && (
                                <a 
                                    href={transaction.invoice_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="invoice-link"
                                >
                                    View Invoice
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="earnings-dashboard">
            <header className="dashboard-header">
                <h1>Earnings Dashboard</h1>
                <p>Track your earnings and transaction history</p>
            </header>

            <nav className="dashboard-tabs">
                <button 
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    className={activeTab === 'transactions' ? 'active' : ''}
                    onClick={() => setActiveTab('transactions')}
                >
                    Transactions
                </button>
            </nav>

            <main className="dashboard-content">
                {activeTab === 'overview' ? renderOverviewTab() : renderTransactionsTab()}
            </main>
        </div>
    );
};

export default EarningsDashboard;