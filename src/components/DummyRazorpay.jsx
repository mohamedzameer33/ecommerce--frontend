import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DummyRazorpay = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [productName, setProductName] = useState('Loading...');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch product name from order details (optional enhancement)
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await axios.get(`http://ecommerce-backend-production-8455.up.railway.app/api/orders/${orderId}`);
        setProductName(res.data.product?.name || 'Unknown Product');
      } catch (err) {
        setProductName('Product Purchase');
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic demo validation
    if (!cardNumber || cardNumber.length < 16) {
      setError('Enter a valid 16-digit card number');
      setLoading(false);
      return;
    }
    if (!expiry || expiry.length !== 5 || !expiry.includes('/')) {
      setError('Enter expiry in MM/YY format');
      setLoading(false);
      return;
    }
    if (!cvv || cvv.length !== 3) {
      setError('Enter valid 3-digit CVV');
      setLoading(false);
      return;
    }
    if (!name.trim()) {
      setError('Cardholder name is required');
      setLoading(false);
      return;
    }

    try {
      // Simulate real Razorpay processing delay
      await new Promise(resolve => setTimeout(resolve, 1800));

      // Complete order on backend
      await axios.post(`https://ecommerce-backend-60zx.onrender.com/api/orders/${orderId}/complete`);

    alert(`Payment Successful! 🎉 Order ID: ${orderId}`);
navigate(`/order-confirmation/${orderId}`); // New route
    } catch (err) {
      const msg = err.response?.data || 'Payment failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .razorpay-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          
          position: relative;
        }

        .razorpay-container {
          width: 100%;
          max-width: 480px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
          overflow: hidden;
          animation: fadeIn 0.7s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .razorpay-header {
          background: #0e1629;
          color: white;
          padding: 1.8rem 2rem;
          text-align: center;
        }

        .razorpay-logo {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .razorpay-amount {
          font-size: 2.8rem;
          font-weight: 700;
          margin: 1rem 0 0.3rem;
        }

        .razorpay-product-info {
          font-size: 1.2rem;
          font-weight: 500;
          opacity: 0.9;
        }

        .razorpay-body {
          padding: 2.5rem 2rem;
        }

        .razorpay-form-group {
          margin-bottom: 1.8rem;
        }

        .razorpay-label {
          display: block;
          margin-bottom: 0.7rem;
          font-weight: 500;
          color: #1e293b;
          font-size: 0.98rem;
        }

        .razorpay-input {
          width: 100%;
          padding: 1rem 1.3rem;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 1.05rem;
          transition: all 0.3s;
          background: #f9fafb;
        }

        .razorpay-input:focus {
          border-color: #0066ff;
          box-shadow: 0 0 0 4px rgba(0,102,255,0.15);
          background: white;
          outline: none;
        }

        .razorpay-pay-btn {
          width: 100%;
          padding: 1.3rem;
          background: linear-gradient(90deg, #0066ff 0%, #0052cc 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 2rem;
        }

        .razorpay-pay-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0,102,255,0.4);
        }

        .razorpay-pay-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .razorpay-loader {
          display: inline-block;
          width: 22px;
          height: 22px;
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

        .razorpay-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 1rem;
          border-radius: 10px;
          margin: 1.2rem 0;
          text-align: center;
          font-size: 0.98rem;
        }

        .razorpay-footer {
          text-align: center;
          padding: 1.5rem;
          background: #f8f9fa;
          font-size: 0.9rem;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }

        .razorpay-secure {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          margin-top: 1.8rem;
          font-size: 1rem;
          color: #16a34a;
          font-weight: 500;
        }

        @media (max-width: 480px) {
          .razorpay-container {
            padding: 2rem 1.5rem;
            margin: 1rem;
          }

          .razorpay-amount {
            font-size: 2.2rem;
          }
        }
      `}</style>

      <div className="razorpay-wrapper">
        <div className="razorpay-container">
          <div className="razorpay-header">
            <div className="razorpay-logo">razorpay</div>
            <div className="razorpay-amount">₹ Pay Now</div>
            <div className="razorpay-product-info">
              {productName}
            </div>
          </div>

          <div className="razorpay-body">
            <form onSubmit={handlePay}>
              <div className="razorpay-form-group">
                <label className="razorpay-label">Card Number</label>
                <input
                  type="text"
                  className="razorpay-input"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  required
                  maxLength="16"
                />
              </div>

              <div style={{ display: 'flex', gap: '1.2rem' }}>
                <div className="razorpay-form-group" style={{ flex: 1 }}>
                  <label className="razorpay-label">Expiry Date</label>
                  <input
                    type="text"
                    className="razorpay-input"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d{0,2})$/, '$1/$2').slice(0, 5))}
                    required
                    maxLength="5"
                  />
                </div>

                <div className="razorpay-form-group" style={{ flex: 1 }}>
                  <label className="razorpay-label">CVV</label>
                  <input
                    type="password"
                    className="razorpay-input"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    required
                    maxLength="3"
                  />
                </div>
              </div>

              <div className="razorpay-form-group">
                <label className="razorpay-label">Cardholder Name</label>
                <input
                  type="text"
                  className="razorpay-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {error && <div className="razorpay-error">{error}</div>}

              <button type="submit" className="razorpay-pay-btn" disabled={loading}>
                {loading ? (
                  <>Processing <span className="razorpay-loader"></span></>
                ) : (
                  'Pay Securely Now'
                )}
              </button>
            </form>

            <div className="razorpay-secure">
              🔒 100% Secured by Razorpay
            </div>
          </div>

          <div className="razorpay-footer">
            This is a demo payment gateway. No real money is charged.
          </div>
        </div>
      </div>
    </>
  );
};

export default DummyRazorpay;
