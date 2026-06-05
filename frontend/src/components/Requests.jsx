import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="requests-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Maintenance Requests</h1>
        <Link to="/requests/new" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: '500' }}>
          + New Request
        </Link>
      </div>
      
      {loading ? (
        <p>Loading requests...</p>
      ) : (
        <div className="grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {requests.map((req) => (
            <div key={req.request_id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{req.request_code}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date(req.request_date).toLocaleDateString()}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: '0.5rem 0' }}>{req.problem_description}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--surface-light)', borderRadius: '4px', fontSize: '0.75rem' }}>
                  {req.priority_name || 'N/A Priority'}
                </span>
                <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.75rem' }}>
                  {req.status_name || 'Open'}
                </span>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>
              No maintenance requests found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Requests;
