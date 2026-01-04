import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext.jsx';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('https://ecommerce-backend-60zx.onrender.com/api/auth/login', {
        username,
        password,
      });

      login(res.data);
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        'Login failed: Invalid username or password';
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
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 2.8rem 2.5rem;
          margin: 1.5rem;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 24px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(14px);
          animation: fadeInUp 0.9s ease-out;
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
          font-size: 3.5rem;
          font-weight: 800;
          background: linear-gradient(90deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.6rem;
        }

        .login-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.4rem;
        }

        .login-subtitle {
          color: #64748b;
          font-size: 1.05rem;
        }

        .form-group {
          margin-bottom: 1.8rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.7rem;
          font-weight: 500;
          color: #475569;
          font-size: 0.98rem;
        }

        .input-field {
          width: 100%;
          padding: 1.1rem 1.4rem;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #f9fafb;
        }

        .input-field:focus {
          border-color: #667eea;
          background: white;
          box-shadow: 0 0 0 5px rgba(102, 126, 234, 0.18);
          outline: none;
        }

        .login-btn {
          width: 100%;
          padding: 1.25rem;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 1.15rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1.2rem;
        }

        .login-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.45);
        }

        .login-btn:disabled {
          background: #a5b4fc;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 4px solid rgba(255,255,255,0.3);
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
          border-radius: 12px;
          margin: 1.2rem 0;
          text-align: center;
          font-size: 0.98rem;
        }

        .register-link {
          text-align: center;
          margin-top: 2rem;
          color: #64748b;
          font-size: 0.98rem;
        }

        .register-link a {
          color: #667eea;
          font-weight: 600;
          text-decoration: none;
        }

        .register-link a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 2rem 1.8rem;
            margin: 1rem;
          }

          .login-title {
            font-size: 1.9rem;
          }
        }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">Shop</div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to continue shopping</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="Enter your username"
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
                  Signing in <span className="loading-spinner" />
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="register-link">
            Don't have an account? <a href="/register">Create one now</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;