import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { User, Mail, Building, Phone, Save, AlertCircle } from 'lucide-react';
import '../index.css';

const SetProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  const [adUser, setAdUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [phone, setPhone] = useState('');
  const [branchName, setBranchName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!location.state || !location.state.adUser) {
      navigate('/login');
      return;
    }
    setAdUser(location.state.adUser);
    setBranches(location.state.branches || []);
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!branchName || !phone) {
      setError('Please provide both phone number and branch.');
      return;
    }

    const selectedBranch = branches.find(b => b.branch_name === branchName);
    if (!selectedBranch) {
      setError('Please select a valid branch from the list.');
      return;
    }

    const branchId = selectedBranch.branch_id;

    setIsSubmitting(true);
    try {
      // Create user with role_id: 1 (Requester)
      await api.post('/users', {
        full_name: adUser.full_name,
        username: adUser.username,
        email: adUser.email,
        phone_number: phone,
        branch_id: branchId,
        role_id: 1 // 1 is Requester
      }, {
        headers: {
          Authorization: `Bearer ${location.state.tempToken}`
        }
      });

      // User created successfully, redirect to login
      navigate('/login', { state: { message: 'Profile created successfully. Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create profile');
      setIsSubmitting(false);
    }
  };

  if (!adUser) return null;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-color)',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, var(--primary) 0%, transparent 60%)',
        opacity: 0.1, filter: 'blur(60px)', pointerEvents: 'none'
      }}></div>
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, var(--secondary) 0%, transparent 60%)',
        opacity: 0.1, filter: 'blur(60px)', pointerEvents: 'none'
      }}></div>

      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '16px',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid var(--border)',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-main)' }}>Complete Profile</h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Welcome, <strong>{adUser.full_name}</strong>. Please complete your profile to continue.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '0', left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}><User size={16} color="var(--text-muted)" /></div>
                <input disabled type="text" value={adUser.username} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', backgroundColor: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '0', left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}><Mail size={16} color="var(--text-muted)" /></div>
                <input disabled type="text" value={adUser.email} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', backgroundColor: 'var(--surface-light)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Branch *</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0', left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}><Building size={16} color="var(--text-muted)" /></div>
              <input 
                type="text" 
                required 
                list="branch-list"
                value={branchName} 
                onChange={(e) => setBranchName(e.target.value)} 
                placeholder="Type to search your branch..."
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none' }} 
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <datalist id="branch-list">
                {branches.map(b => (
                  <option key={b.branch_id} value={b.branch_name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Phone Number *</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0', left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}><Phone size={16} color="var(--text-muted)" /></div>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 911 234 567" style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid var(--border)', borderRadius: '8px', boxSizing: 'border-box', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', outline: 'none' }} 
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.85rem',
              marginTop: '1rem',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s',
              opacity: isSubmitting ? 0.7 : 1
            }}
            onMouseEnter={(e) => { if(!isSubmitting) e.target.style.backgroundColor = 'var(--primary-dark)'; }}
            onMouseLeave={(e) => { if(!isSubmitting) e.target.style.backgroundColor = 'var(--primary)'; }}
          >
            <Save size={18} /> {isSubmitting ? 'Saving Profile...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetProfile;
