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
  const [stats, setStats] = useState({
    totalEarned: '0.00', totalSold: 0, uniqueBuyers: 0, topProducts: []
  });

  const salesChartRef = useRef(null);
  const topProductsChartRef = useRef(null);

  useEffect(() => {
    // Load PDF Libraries from CDN
    const loadScripts = async () => {
      const script1 = document.createElement('script');
      script1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script1.async = true;
      document.body.appendChild(script1);

      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";
        script2.async = true;
        document.body.appendChild(script2);
      };
    };

    loadScripts();

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
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`https://ecommerce-backend-production-8455.up.railway.app/api/products/${id}`);
        fetchData(); // Refresh list
      } catch (err) {
        alert("Failed to delete product.");
      }
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

    setTimeout(() => renderCharts(orders, topProducts), 400);
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
            label: 'Revenue (₹)',
            data: salesData,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
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
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
      });
    }
  };

  const downloadPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Sales Report", 14, 20);
    const tableData = completedOrders.map(o => [
      o.id, o.user?.username || 'Guest', o.product?.name || 'Item', o.quantity, `₹${(o.quantity * (o.product?.price || 0)).toFixed(2)}`, new Date(o.orderDate).toLocaleDateString()
    ]);
    doc.autoTable({
      head: [['ID', 'User', 'Product', 'Qty', 'Total', 'Date']],
      body: tableData,
      startY: 30,
      headStyles: { fillColor: [99, 102, 241] }
    });
    doc.save("Store_Revenue.pdf");
  };

  if (loading) return <div className="loader">Syncing Systems...</div>;

  return (
    <div className="admin-layout">
      <style>{`
        :root { --main: #6366f1; --bg: #f1f5f9; --side: #0f172a; --card: #ffffff; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        
        .admin-layout { display: flex; min-height: 100vh; background: var(--bg); }
        .sidebar { width: 260px; background: var(--side); color: white; padding: 2rem 1.2rem; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; }
        .sidebar h2 { font-size: 1.6rem; color: var(--main); margin-bottom: 2rem; }
        .nav-link { padding: 12px; border-radius: 8px; cursor: pointer; color: #94a3b8; font-weight: 600; margin-bottom: 10px; border:none; background:none; text-align:left; }
        .nav-link.active, .nav-link:hover { background: #1e293b; color: white; }
        
        .main-container { flex: 1; padding: 2rem; overflow-x: hidden; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .stat-card { background: var(--card); padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .stat-label { color: #64748b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
        .stat-val { font-size: 1.6rem; font-weight: 800; margin-top: 5px; color: #1e293b; }

        .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        .chart-box { background: white; padding: 1.5rem; border-radius: 12px; height: 400px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }

        .form-section, .list-section { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 2rem; }
        .input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        input, textarea { padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; width: 100%; }
        textarea { height: 100px; grid-column: 1 / -1; }

        .btn { padding: 12px 24px; border-radius: 8px; cursor: pointer; border: none; font-weight: 700; transition: 0.2s; }
        .btn-p { background: var(--main); color: white; }
        .btn-d { background: #fee2e2; color: #ef4444; padding: 6px 12px; font-size: 0.8rem; }
        
        .table-container { overflow-x: auto; margin-top: 1rem; }
        table { width: 100%; border-collapse: collapse; min-width: 600px; }
        th { text-align: left; padding: 12px; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
        td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
        .loader { height: 100vh; display: flex; justify-content: center; align-items: center; font-weight: 800; color: var(--main); }

        @media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .admin-layout { flex-direction: column; } .sidebar { width: 100%; height: auto; position: relative; } }
      `}</style>

      <aside className="sidebar">
        <h2>Admin Pro</h2>
        <button className="nav-link active">Dashboard</button>
        <button className="nav-link" onClick={() => fetchData()}>Refresh Sync</button>
        <button className="nav-link" style={{ marginTop: 'auto', color: '#f87171' }} onClick={() => { localStorage.removeItem('admin'); window.location.href='/admin'; }}>Logout</button>
      </aside>

      <main className="main-container">
        <div className="header">
          <h1>Store Performance</h1>
          <button className="btn btn-p" onClick={downloadPDF}>Export PDF Report</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><p className="stat-label">Revenue</p><div className="stat-val">₹{stats.totalEarned}</div></div>
          <div className="stat-card"><p className="stat-label">Sales</p><div className="stat-val">{stats.totalSold}</div></div>
          <div className="stat-card"><p className="stat-label">Customers</p><div className="stat-val">{stats.uniqueBuyers}</div></div>
          <div className="stat-card"><p className="stat-label">Stock Types</p><div className="stat-val">{products.length}</div></div>
        </div>

        <div className="charts-grid">
          <div className="chart-box"><h3>Revenue Trend</h3><div style={{height:'320px'}}><canvas id="salesChart"></canvas></div></div>
          <div className="chart-box"><h3>Popular Items</h3><div style={{height:'320px'}}><canvas id="topProductsChart"></canvas></div></div>
        </div>

        <div className="form-section">
          <h3>Add New Inventory</h3>
          <div className="input-grid">
            <input placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            <input placeholder="Price" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
            <input placeholder="Stock" type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
            <input placeholder="Image Link" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} />
            <textarea placeholder="Description..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
          </div>
          <button className="btn btn-p" onClick={async () => {
             await axios.post('https://ecommerce-backend-production-8455.up.railway.app/api/products', newProduct);
             setNewProduct({ name: '', price: '', description: '', stock: '', imageUrl: '' });
             fetchData();
          }}>Add Product</button>
        </div>

        <div className="list-section">
          <h3>Inventory Management</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Action</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.name}</td>
                    <td>₹{p.price}</td>
                    <td>{p.stock}</td>
                    <td><button className="btn btn-d" onClick={() => deleteProduct(p.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="list-section">
          <h3>Recent Orders</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>User</th><th>Product</th><th>Qty</th><th>Date</th></tr>
              </thead>
              <tbody>
                {completedOrders.slice(0, 10).map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.user?.username || 'Guest'}</td>
                    <td>{o.product?.name || 'Deleted Product'}</td>
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
