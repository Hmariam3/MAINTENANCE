import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      setAssets(res.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assets-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Asset Management</h1>
        <Link to="/assets/new" style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: '500' }}>
          + Register Asset
        </Link>
      </div>
      
      {loading ? (
        <p>Loading assets...</p>
      ) : (
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--surface)', borderRadius: '12px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-light)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Asset #</th>
                <th style={{ padding: '1rem' }}>Tag Number</th>
                <th style={{ padding: '1rem' }}>Brand/Model</th>
                <th style={{ padding: '1rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.asset_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{asset.asset_number}</td>
                  <td style={{ padding: '1rem' }}>{asset.tag_number}</td>
                  <td style={{ padding: '1rem' }}>{asset.brand} / {asset.model}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.875rem',
                      backgroundColor: asset.current_status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: asset.current_status === 'Active' ? 'var(--secondary)' : 'var(--danger)'
                    }}>
                      {asset.current_status}
                    </span>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No assets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Assets;
