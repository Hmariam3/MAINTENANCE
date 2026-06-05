import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Dashboard = () => {
  const [stats, setStats] = useState({ total_requests: 0, open_requests: 0, total_assets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data);
        console.log("Dashboard data: ", res.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      <h1 style={{ marginBottom: '2rem' }}>Dashboard Overview</h1>
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-title">Total Requests</div>
          <div className="stat-value">{stats.total_requests}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-title">Open Requests</div>
          <div className="stat-value">{stats.open_requests}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="stat-title">Total Assets</div>
          <div className="stat-value">{stats.total_assets}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
