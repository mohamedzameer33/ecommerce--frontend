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

  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  if (!user) {
    navigate("/login");
    return null;
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );

  const shipping = subtotal > 0 ? 49 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const removeItem = (itemId) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const updateQuantity = (id, type) => {
    const updated = cart.map(item => {
      if (item.id === id) {
        const currentQty = item.quantity || 1;
        const maxStock = item.stock ?? 10;

        let newQty =
          type === "inc" ? currentQty + 1 : currentQty - 1;

        if (newQty < 1) newQty = 1;
        if (newQty > maxStock) newQty = maxStock;

        return { ...item, quantity: newQty };
      }
      return item;
    });

    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "SAVE50") {
      setDiscount(50);
    } else if (promoCode.toUpperCase() === "SAVE100") {
      setDiscount(100);
    } else {
      alert("Invalid promo code");
      setDiscount(0);
    }
  };

  const handleProceedToPayment = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    let lastOrderId = null;

    try {
      for (const item of cart) {
        const payload = {
          user: { id: user.id },
          product: { id: item.id },
          quantity: item.quantity
        };

        const res = await axios.post(
          'https://ecommerce-backend-production-8455.up.railway.app/api/orders',
          payload
        );
        lastOrderId = res.data.id;
      }

      localStorage.removeItem('cart');
      navigate(lastOrderId ? `/payment/${lastOrderId}` : "/");
    } catch (err) {
      const msg = err.response?.data || err.message || 'Failed to place order';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <>
        <style>{`
          .empty-cart {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
          }
          .empty-cart a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 600;
          }
        `}</style>
        <div className="empty-cart">
          <h2>Your Cart is Empty</h2>
          <a href="/">Go shopping</a>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial;
        }

        .cart-container {
          max-width: 1100px;
          margin: 2rem auto;
          padding: 1rem;
        }

        .cart-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }

        .cart-card {
          background: white;
          border-radius: 14px;
          padding: 1rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 90px 1fr 140px 120px 50px;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid #e5e7eb;
          align-items: center;
        }

        .cart-item-image {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 10px;
          background: #f3f4f6;
        }

        .stock-tag {
          display: inline-block;
          margin-top: 6px;
          font-size: 0.85rem;
          color: #16a34a;
          font-weight: 600;
        }

        .qty-box {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .qty-btn {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          background: #e5e7eb;
          cursor: pointer;
          font-weight: bold;
        }

        .qty-btn:hover {
          background: #d1d5db;
        }

        .price {
          font-weight: 700;
          font-size: 1.05rem;
        }

        .remove-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 34px;
          height: 34px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .summary-title {
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 0.6rem 0;
        }

        .promo-box {
          display: flex;
          gap: 0.5rem;
          margin: 1rem 0;
        }

        .promo-input {
          flex: 1;
          padding: 0.6rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .promo-btn {
          padding: 0.6rem 1rem;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          cursor: pointer;
        }

        .checkout-btn {
          width: 100%;
          padding: 0.8rem;
          border: none;
          border-radius: 10px;
          background: #16a34a;
          color: white;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.8rem;
        }

        .checkout-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .clear-btn {
          width: 100%;
          padding: 0.7rem;
          border: none;
          border-radius: 10px;
          background: #ef4444;
          color: white;
          font-weight: 600;
          margin-top: 0.6rem;
          cursor: pointer;
        }

        .error-box {
          background: #fee2e2;
          color: #7f1d1d;
          padding: 0.8rem;
          border-radius: 10px;
          margin-bottom: 1rem;
          text-align: center;
        }

        @media (max-width: 900px) {
          .cart-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .cart-item {
            grid-template-columns: 80px 1fr;
            grid-template-rows: auto auto auto;
            gap: 0.6rem;
          }

          .price {
            grid-column: 2;
          }

          .qty-box {
            grid-column: 2;
          }

          .remove-btn {
            grid-column: 2;
            justify-self: end;
          }
        }
      `}</style>

      <div className="cart-container">
        {error && <div className="error-box">{error}</div>}

        <div className="cart-grid">
          <div className="cart-card">
            <div className="cart-header">
              <h2>Your Cart ({cart.length})</h2>
            </div>

            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img
                  src={item.imageUrl || "https://via.placeholder.com/100?text=No+Img"}
                  alt={item.name}
                  className="cart-item-image"
                />

                <div>
                  <h3>{item.name}</h3>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                    {item.description || "No description"}
                  </p>
                  <span className="stock-tag">In Stock: {item.stock ?? 10}</span>
                </div>

                <div className="price">
                  ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                </div>

                <div className="qty-box">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, "dec")}>-</button>
                  <strong>{item.quantity || 1}</strong>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, "inc")}>+</button>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeItem(item.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="cart-card">
            <div className="summary-title">Order Summary</div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span>₹{shipping.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="summary-row" style={{ color: "#16a34a" }}>
                <span>Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row" style={{ fontWeight: 800 }}>
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <div className="promo-box">
              <input
                className="promo-input"
                placeholder="Promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button className="promo-btn" onClick={applyPromo}>
                Apply
              </button>
            </div>

            <button
              className="checkout-btn"
              onClick={handleProceedToPayment}
              disabled={loading}
            >
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>

            <button className="clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
