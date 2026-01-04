import React from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const navigate = useNavigate();

  // Dummy order ID (you can pass real one via props/useParams if needed)
  const orderId = 'ORD-123456789';

  return (
    <>
      <style>{`
        .success-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 1rem;
        }

        .success-card {
          width: 100%;
          max-width: 480px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 70px rgba(0,0,0,0.35);
          overflow: hidden;
          animation: fadeIn 0.8s ease-out;
          text-align: center;
          padding: 4rem 2.5rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .success-icon {
          font-size: 6.5rem;
          color: #16a34a;
          margin-bottom: 1.5rem;
        }

        .success-title {
          font-size: 2.6rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .success-subtitle {
          font-size: 1.3rem;
          color: #64748b;
          margin-bottom: 2rem;
        }

        .order-id {
          font-size: 1.4rem;
          font-weight: 600;
          color: #1e293b;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
          margin: 1.5rem 0;
        }

        .continue-btn {
          width: 100%;
          padding: 1.3rem;
          background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .continue-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(59,130,246,0.4);
        }

        @media (max-width: 480px) {
          .success-card {
            padding: 3rem 2rem;
          }

          .success-title {
            font-size: 2.2rem;
          }

          .success-icon {
            font-size: 5rem;
          }
        }
      `}</style>

      <div className="success-page">
        <div className="success-card">
          <div className="success-icon">🎉</div>
          <h1 className="success-title">Order Placed!</h1>
          <p className="success-subtitle">Thank you for your purchase</p>

          <div className="order-id">
            Order ID: <strong>{orderId}</strong>
          </div>

          <button className="continue-btn" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    </>
  );
};

export default SuccessPage;