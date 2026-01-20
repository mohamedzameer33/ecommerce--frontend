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
      const [ordersRes, productsRes] = await Promise.all([
        axios.get('https://ecommerce-backend-production-8455.up.railway.app/api/admin/orders/completed'),
        axios.get('https://ecommerce-backend-production-8455.up.railway.app/api/products')
      ]);

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const prods = Array.isArray(productsRes.data) ? productsRes.data : [];

      setCompletedOrders(orders);
      setProducts(prods);
      computeStats(orders, prods);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (orders, prods) => {
    let totalEarned = 0;
    let totalSold = 0;
    const buyers = new Set();
    const productSales = {};

    orders.forEach(order => {
      const price = Number(order.product?.price || 0);
      const qty = Number(order.quantity || 0);
      totalEarned += qty * price;
      totalSold += qty;
      if (order.user?.id) buyers.add(order.user.id);

      const prodId = order.product?.id;
      if (prodId) {
        productSales[prodId] = (productSales[prodId] || 0) + qty;
      }
    });

    const topProducts = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([id, sales]) => {
        const p = prods.find(prod => prod.id === Number(id));
        return { name: p?.name || `Product #${id}`, sales };
      });

    setStats({
      totalEarned: totalEarned.toFixed(2),
      totalSold,
      uniqueBuyers: buyers.size,
      topProducts
    });

    // Slight delay helps ensure canvas elements are mounted
    setTimeout(() => renderCharts(orders), 150);
  };

  const renderCharts = (orders) => {
    // ── Revenue Trend (Line Chart) ───────────────────────────────────────
    const salesByDate = {};
    orders.forEach(o => {
      const date = new Date(o.orderDate).toLocaleDateString('en-CA');
      const value = o.quantity * (o.product?.price || 0);
      salesByDate[date] = (salesByDate[date] || 0) + value;
    });

    const sortedDates = Object.keys(salesByDate).sort();
    const salesData = sortedDates.map(d => salesByDate[d]);

    const salesCtx = document.getElementById('salesChart');
    if (salesCtx && salesData.length > 0) {
      if (salesChartRef.current) salesChartRef.current.destroy();
      salesChartRef.current = new Chart(salesCtx, {
        type: 'line',
        data: {
          labels: sortedDates,
          datasets: [{
            label: 'Revenue ($)',
            data: salesData,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.18)',
            tension: 0.38,
            fill: true,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#6366f1',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { font: { size: 13 } } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(226,232,240,0.6)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // ── Top Products (Doughnut Chart) ────────────────────────────────────
    const pieCtx = document.getElementById('topProductsChart');
    if (pieCtx && stats.topProducts.length > 0) {
      if (topProductsChartRef.current) topProductsChartRef.current.destroy();
      topProductsChartRef.current = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: stats.topProducts.map(p => p.name),
          datasets: [{
            data: stats.topProducts.map(p => p.sales),
            backgroundColor: [
              '#6366f1', '#10b981', '#f59e0b', '#f87171', '#a78bfa'
            ],
            borderColor: '#ffffff',
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'right',
              labels: { padding: 20, font: { size: 13 } }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label}: ${ctx.raw} sold`
              }
            }
          }
        }
      });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price || Number(newProduct.price) <= 0 ||
        !newProduct.stock || Number(newProduct.stock) < 0) {
      alert('Please fill required fields correctly');
      return;
    }

    if (newProduct.imageUrl && !/^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i.test(newProduct.imageUrl)) {
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

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await axios.delete(`https://ecommerce-backend-production-8455.up.railway.app/api/products/${id}`);
      alert('Product deleted');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <>
      <style>{`
        :root {
          --bg: #f8fafc;
          --card: #ffffff;
          --primary: #6366f1;
          --primary-dark: #4f46e5;
          --accent: #10b981;
          --danger: #ef4444;
          --text: #1e293b;
          --text-light: #64748b;
          --border: #e2e8f0;
          --shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
        }

        * { box-sizing: border-box; margin:0; padding:0; }

        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
        }

        .admin-layout {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 260px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 2rem 1.5rem;
          flex-shrink: 0;
        }

        .sidebar h2 {
          font-size: 1.75rem;
          margin-bottom: 0.6rem;
        }

        .sidebar p {
          opacity: 0.9;
          font-size: 0.95rem;
        }

        .logout-btn {
          margin-top: 2.5rem;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 0.9rem;
          border-radius: 10px;
          cursor: pointer;
          width: 100%;
          font-weight: 500;
          transition: 0.2s;
        }

        .logout-btn:hover {
          background: rgba(255,255,255,0.35);
        }

        .main-content {
          flex: 1;
          padding: 2rem 2.5rem;
        }

        .welcome {
          margin-bottom: 2.5rem;
        }

        .welcome h1 {
          font-size: 2.2rem;
          background: linear-gradient(to right, #4f46e5, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.4rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          background: var(--card);
          border-radius: 16px;
          padding: 1.6rem;
          box-shadow: var(--shadow);
          transition: transform 0.25s, box-shadow 0.25s;
        }

        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 30px -10px rgba(99,102,241,0.18);
        }

        .stat-value {
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--primary);
          margin: 0.5rem 0;
        }

        .stat-label {
          color: var(--text-light);
          font-size: 0.95rem;
          font-weight: 500;
        }

        .charts-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.8rem;
          margin-bottom: 2.5rem;
        }

        .chart-card {
          background: var(--card);
          border-radius: 16px;
          padding: 1.6rem;
          box-shadow: var(--shadow);
          height: 420px;
        }

        .chart-card h3 {
          margin-bottom: 1.2rem;
          font-size: 1.3rem;
        }

        .card-content {
          height: calc(100% - 60px);
        }

        canvas {
          width: 100% !important;
          height: 100% !important;
        }

        .admin-card {
          background: var(--card);
          border-radius: 16px;
          padding: 1.8rem;
          box-shadow: var(--shadow);
          margin-bottom: 2rem;
        }

        input {
          width: 100%;
          padding: 0.9rem;
          margin: 0.7rem 0;
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 1rem;
        }

        input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }

        .admin-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.9rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          transition: 0.2s;
        }

        .admin-btn:hover {
          background: var(--primary-dark);
        }

        .delete-btn {
          background: var(--danger);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          cursor: pointer;
        }

        .delete-btn:hover {
          background: #dc2626;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }

        th, td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        th {
          background: #f1f5f9;
          font-weight: 600;
          color: var(--text-light);
          text-transform: uppercase;
          font-size: 0.85rem;
        }

        tr:hover {
          background: #f8fafc;
        }

        .image-preview {
          max-width: 160px;
          border-radius: 10px;
          margin: 0.8rem 0;
          border: 1px solid var(--border);
        }

        .loading, .error {
          padding: 8rem 2rem;
          text-align: center;
          font-size: 1.4rem;
          color: var(--text-light);
        }

        .error { color: var(--danger); }

        @media (max-width: 1100px) {
          .charts-row { grid-template-columns: 1fr; }
          .chart-card { height: 400px; }
        }

        @media (max-width: 768px) {
          .admin-layout { flex-direction: column; }
          .sidebar { width: 100%; text-align: center; padding: 1.8rem 1rem; }
          .main-content { padding: 1.5rem; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 500px) {
          .stats-grid { grid-template-columns: 1fr; }
          .welcome h1 { font-size: 1.8rem; }
        }
      `}</style>

      <div className="admin-layout">
        <div className="sidebar">
          <h2>Admin Dashboard</h2>
          <p>Control Center</p>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="main-content">
          <div className="welcome">
            <h1>Welcome back, Boss! 🛍️</h1>
            <p style={{ color: 'var(--text-light)', fontSize: '1.05rem' }}>
              Here's your store overview — updated in real time
            </p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">₹{stats.totalEarned}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Items Sold</div>
              <div className="stat-value">{stats.totalSold}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Unique Buyers</div>
              <div className="stat-value">{stats.uniqueBuyers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Products Listed</div>
              <div className="stat-value">{products.length}</div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <h3>Revenue Trend</h3>
              <div className="card-content">
                <canvas id="salesChart"></canvas>
              </div>
            </div>
            <div className="chart-card">
              <h3>Top Selling Products</h3>
              <div className="card-content">
                <canvas id="topProductsChart"></canvas>
              </div>
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
              onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <input
              placeholder="Description"
              value={newProduct.description}
              onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Stock Quantity *"
              value={newProduct.stock}
              onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
            />
            <input
              placeholder="Image URL (optional)"
              value={newProduct.imageUrl}
              onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
            />
            {newProduct.imageUrl && (
              <img src={newProduct.imageUrl} alt="preview" className="image-preview" />
            )}
            <button onClick={handleAddProduct} className="admin-btn" style={{ marginTop: '1rem' }}>
              Add Product
            </button>
          </div>

          <div className="admin-card">
            <h3>Manage Products</h3>
            <div className="table-wrapper">
              <table>
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
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>₹{Number(p.price).toFixed(2)}</td>
                      <td>{p.stock}</td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDeleteProduct(p.id)}>
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
              <table>
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
                  {completedOrders.map(o => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.user?.username || '—'}</td>
                      <td>{o.product?.name || '—'}</td>
                      <td>{o.quantity}</td>
                      <td>{new Date(o.orderDate).toLocaleDateString()}</td>
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
