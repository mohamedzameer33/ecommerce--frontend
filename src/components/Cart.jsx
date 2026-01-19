import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext.jsx';
import axios from 'axios';

const Cart = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => {
    return JSON.parse(localStorage.getItem("cart")) || [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!user) {
    navigate("/login");
    return null;
  }

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your Cart is Empty</h2>
        <p><a href="/">Go shopping!</a></p>
      </div>
    );
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  const removeItem = (itemId) => {
    if (!window.confirm("Remove this item?")) return;
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    if (!window.confirm("Clear entire cart?")) return;
    setCart([]);
    localStorage.removeItem("cart");
  };

  const handleProceedToPayment = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    let lastOrderId = null;

    try {
      // Place each cart item as a separate order
      for (const item of cart) {
        const payload = {
          user: { id: user.id },
          product: { id: item.id },
          quantity: item.quantity
        };

        const res = await axios.post('https://ecommerce-backend-production-8455.up.railway.app/api/orders', payload);
        lastOrderId = res.data.id; // Capture the last order ID
      }

      // Success: clear cart and go directly to DummyRazorpay
      alert('Order(s) placed successfully! Redirecting to payment...');
      localStorage.removeItem('cart');

      // Navigate to payment page with the real order ID
      if (lastOrderId) {
        navigate(`/payment/${lastOrderId}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Order error:', err);
      const msg = err.response?.data || err.message || 'Failed to place order';
      setError(msg);
      alert('Error: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .cart-container {
          max-width: 900px;
          margin: 2rem auto;
          padding: 0 1rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 100px 1fr 140px 40px;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid #eee;
          align-items: center;
        }

        .cart-item-image {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
          background: #f5f5f5;
        }

        .cart-item-details h3 {
          margin: 0 0 0.4rem;
          font-size: 1.1rem;
        }

        .cart-item-details p {
          margin: 0.3rem 0;
          color: #555;
        }

        .price {
          font-weight: 600;
          font-size: 1.1rem;
          text-align: right;
        }

        .remove-btn {
          background: #ff4d4f;
          color: white;
          border: none;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-btn:hover {
          background: #d9363e;
        }

        .cart-actions {
          display: flex;
          justify-content: space-between;
          margin: 2rem 0;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .clear-cart-btn {
          background: #ff4d4f;
          color: white;
          border: none;
          padding: 0.7rem 1.4rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .clear-cart-btn:hover {
          background: #d9363e;
        }

        .payment-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.7rem 1.4rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .payment-btn:hover:not(:disabled) {
          background: #218838;
        }

        .payment-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .total-section {
          text-align: right;
          font-size: 1.5rem;
          margin: 1.5rem 0;
          padding-top: 1rem;
          border-top: 2px solid #eee;
        }

        .error-message {
          color: #dc3545;
          background: #f8d7da;
          padding: 1rem;
          border-radius: 10px;
          margin: 1rem 0;
          text-align: center;
        }

        @media (max-width: 600px) {
          .cart-item {
            grid-template-columns: 80px 1fr;
            grid-template-rows: auto auto;
            gap: 0.8rem;
          }

          .cart-item-image {
            width: 80px;
            height: 80px;
            grid-row: 1 / 3;
          }

          .price {
            grid-column: 2;
            text-align: left;
          }

          .remove-btn {
            grid-column: 2;
            justify-self: end;
          }

          .cart-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>

      <div className="cart-container">
        <div className="cart-header">
          <h2>Your Cart ({cart.length} {cart.length === 1 ? "item" : "items"})</h2>
        </div>

        {cart.map((item) => (
          <div key={item.id} className="cart-item">
            <img
              src={item.imageUrl || "https://via.placeholder.com/100?text=No+Img"}
              alt={item.name}
              className="cart-item-image"
              onError={(e) => (e.target.src = "https://via.placeholder.com/100?text=No+Img")}
            />

            <div className="cart-item-details">
              <h3>{item.name}</h3>
              <p>{item.description || "No description available"}</p>
              <div>
                Qty: <strong>{item.quantity || 1}</strong> × ${(item.price || 0).toFixed(2)}
              </div>
            </div>

            <div className="price">
              ${(item.price * (item.quantity || 1)).toFixed(2)}
            </div>

            <button
              className="remove-btn"
              onClick={() => removeItem(item.id)}
              title="Remove item"
            >
              ×
            </button>
          </div>
        ))}

        <div className="total-section">
          <strong>Total: ${total.toFixed(2)}</strong>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="cart-actions">
          <button className="clear-cart-btn" onClick={clearCart}>
            Clear Cart
          </button>

          <button
            className="payment-btn"
            onClick={handleProceedToPayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Proceed to Payment →'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Cart;
