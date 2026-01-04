import React, { useState, useContext, createContext } from 'react';
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
  const navigate = useNavigate(); // Added useNavigate here

  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="app-container">
        <header className="header">
          <div className="header-top">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1>E-Commerce App</h1>
            </Link>
            <div className="search-bar">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
              <button type="button">🔍</button>
            </div>
            <nav>
              {user ? (
                <>
                  <span>Welcome, {user.username}!</span> |
                  <Link to="/">Home</Link> | 
                  <Link to="/cart">Cart</Link> |
                  <button 
                    className="logout-btn" 
                    onClick={() => { 
                      logout(); 
                      navigate('/login'); 
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login">Login</Link> | 
                  <Link to="/register">Register</Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/panel" element={<AdminPanel />} />

            {/* Protected user routes */}
            <Route path="/" element={<PrivateRoute><ProductList /></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
            <Route path="/order-confirmation/:orderId" element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="/payment/:orderId" element={<PrivateRoute><DummyRazorpay /></PrivateRoute>} />
          </Routes>
        </main>

        <footer style={{ textAlign: 'center', padding: '1.5rem', background: '#1e293b', color: 'white', marginTop: 'auto' }}>
          © 2026 E-Commerce App. All rights reserved.
        </footer>
      </div>
    </SearchContext.Provider>
  );
}

export default App;