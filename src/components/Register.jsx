import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext.jsx';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('https://ecommerce-backend-production-8455.up.railway.app/api/auth/register', {
        username,
        password,
        email,
      });

      login(res.data); // Auto login after successful registration
      navigate('/login');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        'Registration failed. Username may already exist.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .register-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .register-card {
          width: 100%;
          max-width: 440px;
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

        .register-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .register-logo {
          font-size: 3.5rem;
          font-weight: 800;
          background: linear-gradient(90deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.6rem;
        }

        .register-title {
          font-size: 2.2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.4rem;
        }

        .register-subtitle {
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

        .register-btn {
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

        .register-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.45);
        }

        .register-btn:disabled {
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

        .login-link {
          text-align: center;
          margin-top: 2rem;
          color: #64748b;
          font-size: 0.98rem;
        }

        .login-link a {
          color: #667eea;
          font-weight: 600;
          text-decoration: none;
        }

        .login-link a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .register-card {
            padding: 2rem 1.8rem;
            margin: 1rem;
          }

          .register-title {
            font-size: 1.9rem;
          }
        }
      `}</style>

      <div className="register-page">
        <div className="register-card">
          <div className="register-header">
            <div className="register-logo">Zam Ecommerce</div>
            <h1 className="register-title">Create Account</h1>
            <p className="register-subtitle">Join us and start shopping</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="input-field"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? (
                <>
                  Creating Account <span className="loading-spinner" />
                </>
              ) : (
                'Register'
              )}
            </button>
          </form>

          <div className="login-link">
            Already have an account? <a href="/login">Sign in here</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
