import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';

const AdminPanel = () => {
  const [completedOrders, setCompletedOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', stock: '', imageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEarned: '0.00', totalSold: 0, uniqueBuyers: 0, topProducts: []
  });

  const salesChartRef = useRef(null);
  const topProductsChartRef = useRef(null);

  // Load PDF Libraries from CDN dynamically
  useEffect(() => {
    const script1 = document.createElement('script');
    script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js";
    document.body.appendChild(script2);

    if (!localStorage.getItem('admin')) {
      window.location.href = '/admin';
      return;
    }
    fetchData();

    return () => {
      if (salesChartRef.current) salesChartRef.current.destroy();
      if (topProductsChartRef.current) topProductsChartRef.current.destroy();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
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
      setError('Failed to sync with database.');
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
      if (prodId) productSales[prodId] = (productSales[prodId] || 0) + qty;
    });

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
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

    setTimeout(() => renderCharts(orders, topProducts), 300);
  };

  const renderCharts = (orders, topProductsData) => {
    const salesByDate = {};
    orders.forEach(o => {
      const date = new Date(o.orderDate).toLocaleDateString('en-CA');
      const value = o.quantity * (o.product?.price || 0);
      salesByDate[date] = (salesByDate[date] || 0) + value;
    });

    const sortedDates = Object.keys(salesByDate).sort();
    const salesData = sortedDates.map(d => salesByDate[d]);

    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
      if (salesChartRef.current) salesChartRef.current.destroy();
      salesChartRef.current = new Chart(salesCtx, {
        type: 'line',
        data: {
          labels: sortedDates,
          datasets: [{
            label: 'Daily Revenue',
            data: salesData,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    const pieCtx = document.getElementById('topProductsChart');
    if (pieCtx && topProductsData.length > 0) {
      if (topProductsChartRef.current) topProductsChartRef.current.destroy();
      topProductsChartRef.current = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
          labels: topProductsData.map(p => p.name),
          datasets: [{
            data: topProductsData.map(p => p.sales),
            backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
      });
    }
  };

  const downloadPDF = () => {
    if (!window.jspdf) {
      alert("PDF library is still loading, please wait a second...");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Sales Report", 14, 20);
    
    const tableData = completedOrders.map(o => [
      o.id,
      o.user?.username || 'Guest',
      o.product?.name || 'Item',
      o.quantity,
      `₹${(o.quantity * (o.product?.price || 0)).toFixed(2)}`,
      new Date(o.orderDate).toLocaleDateString()
    ]);

    doc.autoTable({
      head: [['ID', 'User', 'Product', 'Qty', 'Total', 'Date']],
      body: tableData,
      startY: 30,
      headStyles: { fillColor: [79, 70, 229] }
    });
    
    doc.save("store_report.pdf");
  };

  if (loading) return <div className="loading-state">Loading Store Data...</div>;

  return (
    <div className="admin-app">
      <style>{`
        :root { --p: #4f46e5; --bg: #f8fafc; --txt: #1e293b; --side: #0f172a; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; background: var(--bg); color: var(--txt); }
        .admin-app { display: flex; min-height: 100vh; }
        
        .sidebar { width: 260px; background: var(--side); color: white; padding: 2rem 1rem; position: sticky; top: 0; height: 100vh; }
        .sidebar h2 { font-size: 1.4rem; margin-bottom: 2rem; color: #818cf8; text-align: center; }
        .nav-item { padding: 12px; border-radius: 8px; cursor: pointer; color: #94a3b8; transition: 0.3s; margin-bottom: 5px; }
        .nav-item:hover, .nav-item.active { background: #1e293b; color: white; }
        .logout { margin-top: auto; color: #f87171; }

        .main { flex: 1; padding: 2rem; overflow-x: hidden; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
        .btn-p { background: var(--p); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .s-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid var(--p); }
        .s-val { font-size: 1.8rem; font-weight: 700; margin-top: 5px; }

        .charts { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        .c-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); height: 400px; }

        .data-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        input { padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { text-align: left; padding: 12px; background: #f1f5f9; font-size: 0.8rem; color: #64748b; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
        
        .loading-state { height: 100vh; display: flex; justify-content: center; align-items: center; font-weight: bold; }

        @media (max-width: 1024px) { .charts { grid-template-columns: 1fr; } .admin-app { flex-direction: column; } .sidebar { width: 100%; height: auto; } }
      `}</style>

      <aside className="sidebar">
        <h2>Admin Panel</h2>
        <div className="nav-item active">Dashboard</div>
        <div className="nav-item">Inventory</div>
        <div className="nav-item" onClick={() => { localStorage.removeItem('admin'); window.location.href='/admin' }}>Logout</div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <h1>Dashboard Overview</h1>
            <p style={{ color: '#64748b' }}>Real-time store performance</p>
          </div>
          <button className="btn-p" onClick={downloadPDF}>Download Sales PDF</button>
        </header>

        <div className="stats">
          <div className="s-card"><p>Total Revenue</p><div className="s-val">₹{stats.totalEarned}</div></div>
          <div className="s-card"><p>Orders</p><div className="s-val">{stats.totalSold}</div></div>
          <div className="s-card"><p>Customers</p><div className="s-val">{stats.uniqueBuyers}</div></div>
          <div className="s-card"><p>Products</p><div className="s-val">{products.length}</div></div>
        </div>

        <div className="charts">
          <div className="c-card"><h3>Revenue Trend</h3><div style={{ height: '320px' }}><canvas id="salesChart"></canvas></div></div>
          <div className="c-card"><h3>Top Products</h3><div style={{ height: '320px' }}><canvas id="topProductsChart"></canvas></div></div>
        </div>

        <div className="data-card">
          <h3>Quick Add Product</h3>
          <div className="form-grid">
            <input placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            <input placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
            <input placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
            <input placeholder="Image URL" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} />
          </div>
          <button className="btn-p" onClick={async () => {
            await axios.post('https://ecommerce-backend-production-8455.up.railway.app/api/products', newProduct);
            fetchData();
            setNewProduct({ name: '', price: '', description: '', stock: '', imageUrl: '' });
          }}>Save Product</button>
        </div>

        <div className="data-card">
          <h3>Recent Orders</h3>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>ID</th><th>User</th><th>Product</th><th>Qty</th><th>Date</th></tr>
              </thead>
              <tbody>
                {completedOrders.slice(0, 8).map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.user?.username || 'Guest'}</td>
                    <td>{o.product?.name || 'Item'}</td>
                    <td>{o.quantity}</td>
                    <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
