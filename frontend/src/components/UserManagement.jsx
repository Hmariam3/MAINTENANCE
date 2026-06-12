import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Save, X, Edit } from 'lucide-react';
import '../index.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [lookups, setLookups] = useState({ roles: [], branches: [] });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  
  const [error, setError] = useState('');
  
  const initialFormData = {
    username: '',
    email: '',
    full_name: '',
    phone_number: '',
    role_id: '',
    branch_id: '',
    is_active: true
  };
  const [formData, setFormData] = useState(initialFormData);

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
      setLookups({
        branches: lookupsRes.data.branches || [],
        roles: lookupsRes.data.roles || []
      });
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const openEditModal = (user) => {
    setEditUserId(user.user_id);
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number || '',
      role_id: user.role_id || '',
      branch_id: user.branch_id || '',
      is_active: user.is_active
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.patch(`/users/${editUserId}`, {
        role_id: formData.role_id,
        branch_id: formData.branch_id,
        phone_number: formData.phone_number,
        is_active: formData.is_active
      });
      setShowModal(false);
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || `Failed to update user`);
    }
  };

  if (loading) return <div className="p-6">Loading users...</div>;

  return (
    <div className="p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1f2937' }}>
          <Users color="#4F46E5" /> User Management
        </h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#1f2937' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Full Name</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Username (AD)</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Email</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Role</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#374151' }}>Actions</th>
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
                <td style={{ padding: '0.75rem 1rem' }}>
                  <button onClick={() => openEditModal(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Edit size={16} /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>Edit User</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#6b7280" /></button>
            </div>
            
            {error && <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: '#1f2937' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Full Name</label>
                <input disabled type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', background: '#f3f4f6', color: '#6b7280' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>AD Username</label>
                  <input disabled type="text" name="username" value={formData.username} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', background: '#f3f4f6', color: '#6b7280' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Email</label>
                  <input disabled type="email" name="email" value={formData.email} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', background: '#f3f4f6', color: '#6b7280' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Phone Number</label>
                <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Role *</label>
                  <select required name="role_id" value={formData.role_id} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', background: '#fff' }}>
                    <option value="">Select Role</option>
                    {lookups.roles.map(r => (
                      <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Branch (Optional)</label>
                  <select name="branch_id" value={formData.branch_id} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', boxSizing: 'border-box', background: '#fff' }}>
                    <option value="">Select Branch</option>
                    {lookups.branches.map(b => (
                      <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                  <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                  Account Active
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', color: '#374151' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={16} /> Update User
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
