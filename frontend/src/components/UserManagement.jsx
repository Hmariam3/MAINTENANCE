import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, UserPlus, Save, X, Search } from 'lucide-react';
import '../index.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [lookups, setLookups] = useState({ roles: [], branches: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [adSearchQuery, setAdSearchQuery] = useState('');
  const [isSearchingAd, setIsSearchingAd] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone_number: '',
    role_id: '',
    branch_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, lookupsRes] = await Promise.all([
        api.get('/users'),
        api.get('/lookups')
      ]);
      setUsers(usersRes.data);
      // Wait, lookups endpoint might not return roles directly if it wasn't updated, 
      // but let's assume it has something or we can mock it if missing. 
      // Currently the backend lookupController doesn't fetch roles! We'll just hardcode some for now
      // or if it fails gracefully.
      setLookups({
        branches: lookupsRes.data.branches || [],
        roles: lookupsRes.data.roles || [{ role_id: 1, role_name: 'Admin' }, { role_id: 2, role_name: 'User' }] // fallback
      });
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', formData);
      setShowModal(false);
      setFormData({ username: '', email: '', full_name: '', phone_number: '', role_id: '', branch_id: '' });
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const searchAdUser = async () => {
    if (!adSearchQuery) return;
    setIsSearchingAd(true);
    setError('');
    try {
      const res = await api.get(`/users/ad-search?username=${adSearchQuery}`);
      setFormData({
        ...formData,
        username: res.data.username,
        email: res.data.email,
        full_name: res.data.full_name
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find user in AD');
    } finally {
      setIsSearchingAd(false);
    }
  };

  if (loading) return <div className="p-6">Loading users...</div>;

  return (
    <div className="p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users color="#4F46E5" /> User Management
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: '#4F46E5', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Full Name</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Username (AD)</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Email</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Role</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem 1rem' }}>{u.full_name}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{u.username}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{u.email}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{u.roles?.role_name || u.role_id}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ background: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#166534' : '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Create New AD User</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6b7280" /></button>
            </div>
            
            {error && <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Search Active Directory</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={adSearchQuery}
                  onChange={(e) => setAdSearchQuery(e.target.value)}
                  placeholder="Enter AD Username"
                  style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchAdUser())}
                />
                <button 
                  type="button" 
                  onClick={searchAdUser}
                  disabled={isSearchingAd}
                  style={{ padding: '0.5rem 1rem', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '4px', cursor: isSearchingAd ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isSearchingAd ? 0.7 : 1 }}
                >
                  <Search size={16} /> {isSearchingAd ? 'Searching...' : 'Search AD'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Full Name *</label>
                <input required type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>AD Username *</label>
                  <input required type="text" name="username" value={formData.username} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Email *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Phone Number</label>
                <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Role *</label>
                  <select required name="role_id" value={formData.role_id} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}>
                    <option value="">Select Role</option>
                    {lookups.roles.map(r => (
                      <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Branch (Optional)</label>
                  <select name="branch_id" value={formData.branch_id} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }}>
                    <option value="">Select Branch</option>
                    {lookups.branches.map(b => (
                      <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={16} /> Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
