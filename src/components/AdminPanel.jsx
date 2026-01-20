import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';

const AdminPanel = () => {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [stats, setStats] = useState({
    totalEarned: '0.00',
    totalSold: 0,
    uniqueBuyers: 0,
    topProducts: []
  });

  const salesChartRef = useRef(null);
  const topProductsChartRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem('admin')) {
      window.location.href = '/admin';
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      if (salesChartRef.current) salesChartRef.current.destroy();
      if (topProductsChartRef.current) topProductsChartRef.current.destroy();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin');
    window.location.href = '/admin';
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [completedRes, productsRes] = await Promise.all([
        axios.get('https://ecommerce-backend-production-8455.up.railway.app/api/admin/orders/completed'),
        axios.get('https://ecommerce-backend-production-8455.up.railway.app/api/products')
      ]);

      setCompletedOrders(Array.isArray(completedRes.data) ? completedRes.data : []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);

      computeStats(completedRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // computeStats, renderCharts, handleAddProduct, isValidUrl, handleDeleteProduct
  // remain the same — I'm skipping them here to save space
  // (copy them from your original code)

  // ────────────────────────────────────────────────
  // JUST MAKE SURE YOU KEEP THE FUNCTIONS ABOVE ↑↑↑
  // ────────────────────────────────────────────────

  if (loading) return <div className="loading">Loading admin panel...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <>
      <style>{`
        :root {
          --primary: #3b82f6;
          --danger: #ef4444;
          --success: #10b981;
          --dark: #111827;
          --gray: #6b7280;
          --light: #f9fafb;
          --border: #e5e7eb;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: var(--light);
          color: var(--dark);
          min-height: 100vh;
        }

        .admin-container {
          display: flex;
          min-height: 100vh;
        }

        .admin-sidebar {
          width: 240px;
          background: white;
          border-right: 1px solid var(--border);
          padding: 1.5rem;
          flex-shrink: 0;
        }

        .admin-main {
          flex: 1;
          padding: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .admin-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        h2, h3 {
          color: var(--dark);
          margin-bottom: 1rem;
        }

        .admin-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .admin-btn:hover {
          background: #2563eb;
        }

        .delete-btn {
          background: var(--danger);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .delete-btn:hover {
          background: #dc2626;
        }

        input {
          display: block;
          width: 100%;
          padding: 0.75rem;
          margin: 0.75rem 0;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 1rem;
        }

        input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }

        .image-preview {
          max-width: 180px;
          max-height: 180px;
          object-fit: contain;
          border-radius: 8px;
          margin: 0.5rem 0;
          border: 1px solid var(--border);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        .admin-table th,
        .admin-table td {
          padding: 0.9rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .admin-table th {
          background: #f3f4f6;
          font-weight: 600;
          color: var(--gray);
          text-transform: uppercase;
          font-size: 0.8rem;
        }

        .admin-table tr:hover {
          background: #f9fafb;
        }

        .charts-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .loading, .error {
          text-align: center;
          padding: 4rem 1rem;
          font-size: 1.2rem;
          color: var(--gray);
        }

        .error { color: var(--danger); }

        /* ─── Responsive ──────────────────────────────────────── */

        @media (max-width: 1024px) {
          .charts-container {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .admin-container {
            flex-direction: column;
          }

          .admin-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--border);
            padding: 1.25rem;
            text-align: center;
          }

          .admin-main {
            padding: 1rem;
          }

          .admin-card {
            padding: 1.25rem;
          }

          .admin-table {
            font-size: 0.9rem;
          }

          .admin-table th, .admin-table td {
            padding: 0.7rem 0.6rem;
          }

          /* Horizontal scroll on small screens for tables */
          .table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }

        @media (max-width: 480px) {
          h2 { font-size: 1.4rem; }
          h3 { font-size: 1.2rem; }

          .admin-btn, .delete-btn {
            width: 100%;
            padding: 0.9rem;
            font-size: 1rem;
          }

          input {
            padding: 0.8rem;
            font-size: 0.95rem;
          }

          .image-preview {
            max-width: 140px;
            max-height: 140px;
          }
        }
      `}</style>

      <div className="admin-container">
        <div className="admin-sidebar">
          <h2>Admin Dashboard</h2>
          <p>Welcome, Boss!</p>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="admin-main">
          {/* Optional: Charts Section */}
          <div className="charts-container">
            <div className="chart-card">
              <h3>Daily Sales Trend</h3>
              <canvas id="salesChart" height="280"></canvas>
            </div>
            <div className="chart-card">
              <h3>Top Products</h3>
              <canvas id="topProductsChart" height="280"></canvas>
            </div>
          </div>

          <div className="admin-card add-product-card">
            <h3>Add New Product</h3>
            <input
              placeholder="Product Name *"
              value={newProduct.name}
              onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price *"
              value={newProduct.price}
              onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <input
              placeholder="Description"
              value={newProduct.description}
              onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Stock *"
              value={newProduct.stock}
              onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
            />
            <input
              placeholder="Image URL (optional)"
              value={newProduct.imageUrl}
              onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
            />
            {newProduct.imageUrl && (
              <img src={newProduct.imageUrl} alt="Preview" className="image-preview" />
            )}
            <button onClick={handleAddProduct} className="admin-btn">
              Add Product
            </button>
          </div>

          <div className="admin-card">
            <h3>Manage Products</h3>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => (
                    <tr key={prod.id}>
                      <td>{prod.id}</td>
                      <td>{prod.name}</td>
                      <td>${Number(prod.price).toFixed(2)}</td>
                      <td>{prod.stock}</td>
                      <td>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card">
            <h3>Past Completed Orders</h3>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.user?.username || '—'}</td>
                      <td>{order.product?.name || '—'}</td>
                      <td>{order.quantity}</td>
                      <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
