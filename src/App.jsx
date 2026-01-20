import React, { useState, useContext } from 'react';
import { Route, Routes, Navigate, Link, useNavigate } from 'react-router-dom';
import { UserContext } from './context/UserContext.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import ProductList from './components/ProductList.jsx';
import Cart from './components/Cart.jsx';
import Checkout from './components/Checkout.jsx';
import DummyRazorpay from './components/DummyRazorpay.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import AdminPanel from './components/AdminPanel.jsx';

export const SearchContext = createContext(null);

function App() {
  const { user, logout } = useContext(UserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" replace />;
  };

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="app-wrapper">

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <header className="site-header">
          <div className="header-container">
            <Link to="/" className="logo-link">
              <h1 className="logo">E-Shop</h1>
            </Link>

            <div className="search-wrapper">
              <input
                type="search"
                placeholder="Search products, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="button" className="search-btn" aria-label="Search">
                🔍
              </button>
            </div>

            <nav className="main-nav">
              {user ? (
                <div className="user-actions">
                  <span className="welcome-msg">Hi, {user.username}</span>
                  <Link to="/" className="nav-link">Home</Link>
                  <Link to="/cart" className="nav-link cart-link">
                    Cart
                    {/* Optional: cart count badge later */}
                  </Link>
                  <button
                    className="logout-btn"
                    onClick={() => {
                      logout();
                      navigate('/login', { replace: true });
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="auth-links">
                  <Link to="/login" className="nav-link login-link">Login</Link>
                  <Link to="/register" className="nav-link signup-link">Sign Up</Link>
                </div>
              )}
            </nav>
          </div>
        </header>

        {/* ── MAIN CONTENT ────────────────────────────────────────── */}
        <main className="main-content">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/panel" element={<AdminPanel />} />

            <Route path="/" element={<PrivateRoute><ProductList /></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
            <Route path="/order-confirmation/:orderId" element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="/payment/:orderId" element={<PrivateRoute><DummyRazorpay /></PrivateRoute>} />

            {/* Optional: 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer className="site-footer">
          <div className="footer-container">
            <div className="footer-brand">
              <h2 className="footer-logo">E-Shop</h2>
              <p>Modern shopping experience • 2026</p>
            </div>

            <div className="footer-links">
              <div className="link-group">
                <h3>Company</h3>
                <a href="#">About Us</a>
                <a href="#">Careers</a>
                <a href="#">Contact</a>
              </div>
              <div className="link-group">
                <h3>Support</h3>
                <a href="#">Help Center</a>
                <a href="#">Returns</a>
                <a href="#">FAQ</a>
              </div>
              <div className="link-group">
                <h3>Legal</h3>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} E-Shop. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* ── INTERNAL RESPONSIVE + BEAUTIFUL STYLES ──────────────────────── */}
      <style>{`
        :root {
          --primary: #6366f1;
          --primary-dark: #4f46e5;
          --text: #1e293b;
          --text-light: #64748b;
          --bg: #f8fafc;
          --card: #ffffff;
          --border: #e2e8f0;
          --shadow-sm: 0 4px 10px rgba(0,0,0,0.06);
          --radius: 12px;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .app-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
          font-family: system-ui, -apple-system, sans-serif;
          color: var(--text);
        }

        /* ── HEADER ──────────────────────────────────────────────── */
        .site-header {
          background: white;
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid var(--border);
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .logo-link {
          text-decoration: none;
          color: var(--primary-dark);
          font-weight: 700;
        }

        .logo {
          font-size: 1.8rem;
          letter-spacing: -0.5px;
        }

        .search-wrapper {
          flex: 1;
          min-width: 220px;
          max-width: 480px;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.8rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 1rem;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .search-btn {
          position: absolute;
          left: 0.8rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          color: var(--text-light);
        }

        .main-nav {
          display: flex;
          align-items: center;
          gap: 1.4rem;
        }

        .nav-link, .login-link, .signup-link {
          color: var(--text);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover, .login-link:hover, .signup-link:hover {
          color: var(--primary);
        }

        .login-link { font-weight: 600; }
        .signup-link {
          background: var(--primary);
          color: white;
          padding: 0.5rem 1.1rem;
          border-radius: 8px;
        }

        .signup-link:hover {
          background: var(--primary-dark);
          color: white;
        }

        .welcome-msg {
          color: var(--text-light);
          font-size: 0.95rem;
        }

        .logout-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .logout-btn:hover {
          background: #dc2626;
        }

        /* ── MAIN ────────────────────────────────────────────────── */
        .main-content {
          flex: 1;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          padding: 1.5rem;
        }

        /* ── FOOTER ──────────────────────────────────────────────── */
        .site-footer {
          background: #0f172a;
          color: #e2e8f0;
          margin-top: auto;
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 1.5rem 2rem;
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 3rem;
        }

        .footer-brand h2 {
          color: white;
          font-size: 1.6rem;
          margin-bottom: 0.6rem;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 3rem;
        }

        .link-group {
          min-width: 140px;
        }

        .link-group h3 {
          color: white;
          font-size: 1.05rem;
          margin-bottom: 1rem;
        }

        .link-group a {
          display: block;
          color: #cbd5e1;
          text-decoration: none;
          margin-bottom: 0.7rem;
          font-size: 0.95rem;
          transition: color 0.2s;
        }

        .link-group a:hover {
          color: white;
        }

        .footer-bottom {
          border-top: 1px solid #334155;
          padding: 1.2rem 1.5rem;
          text-align: center;
          font-size: 0.9rem;
          color: #94a3b8;
        }

        /* ── RESPONSIVE ──────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .header-container {
            flex-direction: column;
            align-items: stretch;
            gap: 1.2rem;
          }

          .search-wrapper {
            order: 3;
            max-width: none;
          }

          .footer-container {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }

        @media (max-width: 640px) {
          .logo { font-size: 1.6rem; }

          .main-nav {
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
          }

          .search-input {
            padding: 0.7rem 0.9rem 0.7rem 2.6rem;
            font-size: 0.95rem;
          }

          .footer-container {
            padding: 2.5rem 1rem 1.8rem;
          }
        }
      `}</style>
    </SearchContext.Provider>
  );
}

export default App;
