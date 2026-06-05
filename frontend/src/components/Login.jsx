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
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100" style={{ background: '#f4f7f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg" style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div style={{ background: '#4F46E5', color: '#fff', padding: '1rem', borderRadius: '50%' }}>
              <LogIn size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            Asset Manager Login
          </h2>
          <p className="mt-2 text-sm text-gray-600" style={{ color: '#666', marginTop: '0.5rem' }}>
            Use your Active Directory credentials
          </p>
        </div>

        {error && (
          <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <div>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0', left: 0, paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <User size={18} color="#9ca3af" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.5rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }}
                placeholder="domain\user or user@domain.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: '0', left: 0, paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Lock size={18} color="#9ca3af" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.5rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '6px',
                background: isSubmitting ? '#a5b4fc' : '#4F46E5',
                color: 'white',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
