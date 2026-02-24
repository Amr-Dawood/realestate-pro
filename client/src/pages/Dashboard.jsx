import { useState, useEffect } from 'react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-description">
                    Overview of your real estate data and comparison system
                </p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary">🏢</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.developers || 0}</div>
                        <div className="stat-label">Developers</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon accent">🏘️</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.compounds || 0}</div>
                        <div className="stat-label">Compounds</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning">🏠</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.units || 0}</div>
                        <div className="stat-label">Total Units</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon danger">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats?.availableUnits || 0}</div>
                        <div className="stat-label">Available Units</div>
                    </div>
                </div>
            </div>

            <div className="card-grid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">💰 Price Statistics</h3>
                    </div>
                    <div className="stat-content">
                        <div className="result-card-details">
                            <div className="result-card-detail">
                                <span>Min:</span>
                                <strong>{formatCurrency(stats?.priceStats?._min?.price)}</strong>
                            </div>
                            <div className="result-card-detail">
                                <span>Avg:</span>
                                <strong>{formatCurrency(stats?.priceStats?._avg?.price)}</strong>
                            </div>
                            <div className="result-card-detail">
                                <span>Max:</span>
                                <strong>{formatCurrency(stats?.priceStats?._max?.price)}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">🚀 Quick Actions</h3>
                    </div>
                    <div className="flex flex-col gap-md">
                        <a href="/developers" className="btn btn-primary">
                            ➕ Add Developer
                        </a>
                        <a href="/compounds" className="btn btn-secondary">
                            ➕ Add Compound
                        </a>
                        <a href="/comparison" className="btn btn-accent">
                            🔍 Start Comparison
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatCurrency(amount) {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
        maximumFractionDigits: 0
    }).format(amount);
}
