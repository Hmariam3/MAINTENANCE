import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import '../index.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/');
    } else if (result.requires_profile) {
      navigate('/set-profile', { state: { adUser: result.adUser, branches: result.branches, tempToken: result.tempToken } });
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '3rem 2rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        color: '#fff',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38b2ac 0%, #3182ce 100%)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            marginBottom: '1rem'
          }}>
            <LogIn size={32} color="#fff" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
            Welcome Back
          </h2>
          <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
            Login with your Active Directory credentials
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(254, 226, 226, 0.9)',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0', left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <User size={18} color="rgba(255,255,255,0.5)" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, background-color 0.2s'
                }}
                placeholder="domain\user"
                onFocus={(e) => { e.target.style.borderColor = '#63b3ed'; e.target.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.background = 'rgba(255, 255, 255, 0.05)'; }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0', left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Lock size={18} color="rgba(255,255,255,0.5)" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s, background-color 0.2s'
                }}
                placeholder="••••••••"
                onFocus={(e) => { e.target.style.borderColor = '#63b3ed'; e.target.style.background = 'rgba(255, 255, 255, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.background = 'rgba(255, 255, 255, 0.05)'; }}
              />
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.875rem',
                border: 'none',
                borderRadius: '8px',
                background: isSubmitting ? 'linear-gradient(135deg, #4fd1c5 0%, #319795 100%)' : 'linear-gradient(135deg, #38b2ac 0%, #3182ce 100%)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.1s, box-shadow 0.1s'
              }}
              onMouseDown={(e) => { if(!isSubmitting) e.target.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { if(!isSubmitting) e.target.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
