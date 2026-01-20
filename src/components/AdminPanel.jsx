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

  // Cleanup charts when component unmounts
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

      const completed = Array.isArray(completedRes.data) ? completedRes.data : [];
      const prods = Array.isArray(productsRes.data) ? productsRes.data : [];

      setCompletedOrders(completed);
      setProducts(prods);

      computeStats(completed);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (orders) => {
    let totalEarned = 0;
    let totalSold = 0;
    const buyers = new Set();
    const productSales = {};

    orders.forEach(order => {
      const price = Number(order.product?.price || 0);
      const qty = Number(order.quantity || 0);
      const saleValue = qty * price;

      totalEarned += saleValue;
      totalSold += qty;

      if (order.user?.id) buyers.add(order.user.id);

      const prodId = order.product?.id;
      if (prodId) {
        productSales[prodId] = (productSales[prodId] || 0) + qty;
      }
    });

    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, sales]) => {
        const prod = products.find(p => p.id === Number(id));
        return { name: prod?.name || 'Unknown', sales };
      });

    setStats({
      totalEarned: totalEarned.toFixed(2),
      totalSold,
      uniqueBuyers: buyers.size,
      topProducts
    });

    // Clean up previous chart instances
    if (salesChartRef.current) salesChartRef.current.destroy();
    if (topProductsChartRef.current) topProductsChartRef.current.destroy();

    renderCharts(orders);
  };

  const renderCharts = (orders) => {
    // ── Sales over time (line chart) ───────────────────────────────────────
    const salesData = {};
    orders.forEach(order => {
      const date = new Date(order.orderDate).toLocaleDateString('en-CA');
      const value = order.quantity * (order.product?.price || 0);
      salesData[date] = (salesData[date] || 0) + value;
    });

    const labels = Object.keys(salesData).sort();
    const data = labels.map(date => salesData[date]);

    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
      salesChartRef.current = new Chart(salesCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Daily Earnings ($)',
            data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.12)',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // ── Top products (pie chart) ───────────────────────────────────────────
    const pieLabels = stats.topProducts.map(p => p.name);
    const pieData = stats.topProducts.map(p => p.sales);

    const pieCtx = document.getElementById('topProductsChart');
    if (pieCtx) {
      topProductsChartRef.current = new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: pieLabels,
          datasets: [{
            data: pieData,
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          }
        }
      });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price || Number(newProduct.price) <= 0 ||
        !newProduct.stock || Number(newProduct.stock) < 0) {
      alert('Please fill required fields correctly (name, price > 0, stock ≥ 0)');
      return;
    }

    if (newProduct.imageUrl && !isValidUrl(newProduct.imageUrl)) {
      alert('Please enter a valid image URL');
      return;
    }

    try {
      await axios.post('https://ecommerce-backend-production-8455.up.railway.app/api/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock, 10)
      });

      alert('Product added successfully!');
      setNewProduct({ name: '', price: '', description: '', stock: '', imageUrl: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add product');
    }
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;

    try {
      await axios.delete(`https://ecommerce-backend-production-8455.up.railway.app/api/products/${id}`);
      alert('Product deleted');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

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

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: system-ui, sans-serif;
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
          width: 100%;
        }

        .admin-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          padding: 1.5rem;
          margin-bottom: 1.75rem;
        }

        h2, h3 { margin-bottom: 1rem; color: var(--dark); }

        input, button {
          font: inherit;
        }

        input {
          width: 100%;
          padding: 0.75rem;
          margin: 0.6rem 0;
          border: 1px solid var(--border);
          border-radius: 6px;
        }

        input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }

        .admin-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.8rem 1.4rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .admin-btn:hover { background: #2563eb; }

        .delete-btn {
          background: var(--danger);
          color: white;
          border: none;
          padding: 0.55rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .delete-btn:hover { background: #dc2626; }

        .image-preview {
          max-width: 160px;
          max-height: 160px;
          object-fit: contain;
          border-radius: 8px;
          margin: 0.8rem 0;
          border: 1px solid var(--border);
        }

        .table-wrapper {
          overflow-x: auto;
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
          font-size: 0.82rem;
        }

        .admin-table tr:hover { background: #f9fafb; }

        .charts-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 1.25rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          height: 360px;
        }

        .chart-card h3 { margin-bottom: 1rem; }

        canvas { width: 100% !important; height: 100% !important; }

        .loading, .error {
          padding: 6rem 1rem;
          text-align: center;
          font-size: 1.3rem;
          color: var(--gray);
        }

        .error { color: var(--danger); }

        /* ────────────────────────────────────────────────
           Responsive Design
        ──────────────────────────────────────────────── */

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
            text-align: center;
          }

          .admin-main {
            padding: 1rem;
          }

          .admin-card {
            padding: 1.25rem;
          }
        }

        @media (max-width: 480px) {
          h2 { font-size: 1.5rem; }
          h3 { font-size: 1.25rem; }

          .admin-btn, .delete-btn {
            width: 100%;
            padding: 0.9rem;
          }

          input { padding: 0.8rem; font-size: 0.95rem; }

          .image-preview {
            max-width: 140px;
            max-height: 140px;
          }

          .admin-table th, .admin-table td {
            padding: 0.7rem 0.6rem;
            font-size: 0.88rem;
          }
        }
      `}</style>

      <div className="admin-container">
        <div className="admin-sidebar">
          <h2>Admin Dashboard</h2>
          <p>Welcome, Boss!</p>
          <button
            onClick={handleLogout}
            style={{ marginTop: '1.8rem' }}
            className="delete-btn"
          >
            Logout
          </button>
        </div>

        <div className="admin-main">
          <div className="charts-container">
            <div className="chart-card">
              <h3>Daily Sales Trend</h3>
              <canvas id="salesChart"></canvas>
            </div>
            <div className="chart-card">
              <h3>Top 5 Products</h3>
              <canvas id="topProductsChart"></canvas>
            </div>
          </div>

          <div className="admin-card">
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
              onChange={e => setNewProduct({ ...newProduct, price: e.target.value || '' })}
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
              onChange={e => setNewProduct({ ...newProduct, stock: e.target.value || '' })}
            />
            <input
              placeholder="Image URL (optional)"
              value={newProduct.imageUrl}
              onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
            />
            {newProduct.imageUrl && (
              <img src={newProduct.imageUrl} alt="preview" className="image-preview" />
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
                          className="delete-btn"
                          onClick={() => handleDeleteProduct(prod.id)}
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
            <h3>Completed Orders</h3>
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
