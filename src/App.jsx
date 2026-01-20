import React, { useState, useContext } from 'react';
import {
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from 'react-router-dom';

import { UserContext } from './context/UserContext.jsx';

import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import ProductList from './components/ProductList.jsx';
import Cart from './components/Cart.jsx';
import Checkout from './components/Checkout.jsx';
import DummyRazorpay from './components/DummyRazorpay.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import AdminPanel from './components/AdminPanel.jsx';

export const SearchContext = React.createContext(null);

function App() {
  const { user, logout } = useContext(UserContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" replace />;
  };

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="app-layout">

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <header className="site-header">
          <div className="header-inner">
            <Link to="/" className="logo">
              <h1>E-Commerce</h1>
            </Link>

            <div className="search-container">
              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button className="search-btn">🔍</button>
            </div>

            <nav className="nav-bar">
              {user ? (
                <>
                  <span className="welcome">Hi, {user.username}</span>
                  <Link to="/">Home</Link>
                  <Link to="/cart">Cart</Link>
                  <button
                    className="logout-button"
                    onClick={() => {
                      logout();
                      navigate('/login', { replace: true });
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="auth-link">Login</Link>
                  <Link to="/register" className="auth-link signup">Register</Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* ── MAIN CONTENT ────────────────────────────────────────── */}
        <main className="main-content">
          <Routes>
            <Route path="/login"    element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

            <Route path="/admin"       element={<AdminLogin />} />
            <Route path="/admin/panel" element={<AdminPanel />} />

            <Route path="/" element={
              <PrivateRoute>
                <ProductList />
              </PrivateRoute>
            } />

            <Route path="/cart" element={
              <PrivateRoute>
                <Cart />
              </PrivateRoute>
            } />

            <Route path="/order-confirmation/:orderId" element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            } />

            <Route path="/payment/:orderId" element={
              <PrivateRoute>
                <DummyRazorpay />
              </PrivateRoute>
            } />

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer className="site-footer">
          <div className="footer-content">
            <p>© {new Date().getFullYear()} E-Commerce App. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      {/* ── STYLES ──────────────────────────────────────────────────────── */}
      <style>{`
        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* Header */
        .site-header {
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          position: sticky;
          top: 0;
          z-index: 1000;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-inner {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .logo h1 {
          margin: 0;
          font-size: 1.9rem;
          color: #4f46e5;
          font-weight: 700;
        }

        .search-container {
          flex: 1;
          min-width: 240px;
          max-width: 500px;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.8rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
        }

        .search-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }

        .search-btn {
          position: absolute;
          left: 112px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.1rem;
          color: #6b7280;
          cursor: pointer;
        }

        .nav-bar {
          display: flex;
          align-items: center;
          gap: 1.4rem;
          flex-wrap: wrap;
        }

        .nav-bar a,
        .auth-link {
          color: #1e293b;
          text-decoration: none;
          font-weight: 500;
        }

        .auth-link.signup {
          background: #6366f1;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
        }

        .welcome {
          color: #64748b;
          font-size: 0.95rem;
        }

        .logout-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .logout-button:hover {
          background: #dc2626;
        }

        /* Main */
        .main-content {
          flex: 1;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          padding: 1.5rem;
        }

        /* Footer */
        .site-footer {
          background: #0f172a;
          color: #cbd5e1;
          margin-top: auto;
        }

        .footer-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
        }

        .footer-links {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-links a {
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.95rem;
        }

        .footer-links a:hover {
          color: white;
        }

        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .header-inner {
            flex-direction: column;
            align-items: stretch;
          }

          .search-container {
            order: 3;
            max-width: none;
          }
        }

        @media (max-width: 640px) {
          .logo h1 {
            font-size: 1.6rem;
          }

          .nav-bar {
            justify-content: center;
            gap: 1rem;
          }
        }
      `}</style>
    </SearchContext.Provider>
  );
}

export default App;
