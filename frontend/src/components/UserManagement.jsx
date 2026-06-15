import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Save, X, Edit, Search } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [lookups, setLookups] = useState({ roles: [], branches: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary)', borderRadius: '8px', color: '#fff', display: 'flex' }}>
              <Users size={24} />
            </div>
            User Management
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage user roles, branch assignments, and account access.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', position: 'relative', maxWidth: '400px' }}>
        <div style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }}>
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Search users..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', 
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)', 
            borderRadius: '8px', color: 'var(--text-main)', outline: 'none' 
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
      ) : (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-light)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Full Name</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Username / Email</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Role</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-light)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '500', color: 'var(--text-main)' }}>{u.full_name}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: '500', color: 'var(--primary)' }}>{u.username}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-main)' }}>{u.roles?.role_name || u.role_id}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: u.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: u.is_active ? 'var(--secondary)' : 'var(--danger)'
                      }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => openEditModal(u)}
                        style={{ 
                          background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', 
                          cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '6px',
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s',
                          fontWeight: '600', fontSize: '0.85rem'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; }}
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Users size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <div>No users found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Edit User</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {error && <div style={{ color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Full Name</label>
                  <input disabled type="text" name="full_name" value={formData.full_name} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>AD Username</label>
                    <input disabled type="text" name="username" value={formData.username} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Email</label>
                    <input disabled type="email" name="email" value={formData.email} style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Phone Number</label>
                  <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} 
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none' }} 
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Role *</label>
                    <select required name="role_id" value={formData.role_id} onChange={handleInputChange} 
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    >
                      <option value="">Select Role</option>
                      {lookups.roles.map(r => (
                        <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>Branch (Optional)</label>
                    <select name="branch_id" value={formData.branch_id} onChange={handleInputChange} 
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    >
                      <option value="">Select Branch</option>
                      {lookups.branches.map(b => (
                        <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', cursor: 'pointer' }}>
                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                    Account Active (Can Login)
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} 
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: '600' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-main)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    Cancel
                  </button>
                  <button type="submit" 
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                  >
                    <Save size={18} /> Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
