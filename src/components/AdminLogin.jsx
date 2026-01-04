import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('http://localhost:8080/api/admin/login', { username, password });
      localStorage.setItem('admin', 'true');
      navigate('/admin/panel');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .login-wrapper {
          width: 100%;
          max-width: 420px;
          padding: 2.5rem 2rem;
          margin: 1rem;
          background: rgba(0, 95, 255, 0.3);
          border-radius: 24px;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          animation: fadeInUp 0.8s ease-out;
          position: relative;
          z-index: 10;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-logo {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .login-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .login-subtitle {
          color: #64748b;
          font-size: 1rem;
        }

        .form-group {
          margin-bottom: 1.6rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.6rem;
          font-weight: 500;
          color: #475569;
          font-size: 0.95rem;
        }

        .input-field {
          width: 100%;
          padding: 1rem 1.3rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f8fafc;
        }

        .input-field:focus {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.15);
          outline: none;
        }

        .login-btn {
          width: 100%;
          padding: 1.2rem;
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .login-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(59,130,246,0.35);
        }

        .login-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          display: inline-block;
          width: 22px;
          height: 22px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
          margin-left: 12px;
          vertical-align: middle;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          background: #fee2e2;
          color: #991b1b;
          padding: 1rem;
          border-radius: 10px;
          margin: 1rem 0;
          text-align: center;
          font-size: 0.95rem;
        }

        .secure-note {
          text-align: center;
          color: #64748b;
          font-size: 0.85rem;
          margin-top: 2rem;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .login-wrapper {
            padding: 2rem 1.5rem;
            margin: 1rem;
          }

          .login-title {
            font-size: 1.8rem;
          }
        }
      `}</style>

      <div className="login-page">
        <div className="login-wrapper">
          <div className="login-header">
            <div className="login-logo">Admin</div>
            <h1 className="login-title">Secure Access</h1>
            <p className="login-subtitle">Administrator Portal</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  Authenticating <span className="loading-spinner" />
                </>
              ) : (
                'Login to Dashboard'
              )}
            </button>
          </form>

          <p className="secure-note">
            Protected area — Unauthorized access is strictly prohibited
          </p>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;