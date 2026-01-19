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
    // Security check - redirect if not logged in as admin
    if (!localStorage.getItem('admin')) {
      window.location.href = '/admin';
      return;
    }
    fetchData();
  }, []);

  // Cleanup charts on unmount
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
        axios.get('https://ecommerce-backend-production-8455.up.railway.app//api/admin/orders/completed'),
        axios.get('https://ecommerce-backend-production-8455.up.railway.app//api/products')
      ]);

      const completed = Array.isArray(completedRes.data) ? completedRes.data : [];
      const prods = Array.isArray(productsRes.data) ? productsRes.data : [];

      setCompletedOrders(completed);
      setProducts(prods);

      computeStats(completed);
    } catch (err) {
      console.error('Fetch error:', err);
      const msg = err.response?.data || err.message || 'Failed to load data. Check backend.';
      setError(msg);
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

    // Destroy old charts
    if (salesChartRef.current) salesChartRef.current.destroy();
    if (topProductsChartRef.current) topProductsChartRef.current.destroy();

    renderCharts(orders);
  };

  const renderCharts = (orders) => {
    // Sales over time
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
            backgroundColor: 'rgba(59,130,246,0.1)',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }

    // Top products pie
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
          plugins: {
            legend: { position: 'right' }
          }
        }
      });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price || Number(newProduct.price) <= 0 || !newProduct.stock || Number(newProduct.stock) < 0) {
      alert('Please fill all required fields correctly');
      return;
    }

    if (newProduct.imageUrl && !isValidUrl(newProduct.imageUrl)) {
      alert('Invalid image URL');
      return;
    }

    try {
      await axios.post('https://ecommerce-backend-production-8455.up.railway.app/api/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock)
      });
      alert('Product added successfully!');
      setNewProduct({ name: '', price: '', description: '', stock: '', imageUrl: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data || err.message || 'Failed to add product';
      alert(msg);
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
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`https://ecommerce-backend-production-8455.up.railway.app/api/products/${id}`);
      alert('Product deleted successfully');
      fetchData();
    } catch (error) {
      const msg = error.response?.data || 'Failed to delete product';
      alert(msg);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <h2>Admin Dashboard</h2>
        <p>Welcome, Boss!</p>
        <button 
          onClick={handleLogout}
          style={{
            marginTop: '2rem',
            padding: '0.8rem 1.2rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Logout
        </button>
      </div>
      <div className="admin-main">
        <div className="admin-card add-product-card">
          <h3>Add New Product</h3>
          <input placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
          <input type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
          <input placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
          <input type="number" placeholder="Stock" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} />
          <input placeholder="Image URL" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} />
          {newProduct.imageUrl && <img src={newProduct.imageUrl} alt="Preview" className="image-preview" />}
          <button onClick={handleAddProduct} className="admin-btn">Add Product</button>
        </div>

        <div className="admin-card">
          <h3>Manage Products</h3>
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
            <tbody>
              {products.map(prod => (
                <tr key={prod.id}>
                  <td>{prod.id}</td>
                  <td>{prod.name}</td>
                  <td>${prod.price}</td>
                  <td>{prod.stock}</td>
                  <td><button onClick={() => handleDeleteProduct(prod.id)} className="delete-btn">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Past Orders */}
        <div className="admin-card">
          <h3>Past Orders (Completed)</h3>
          <table className="admin-table">
            <thead><tr><th>ID</th><th>User</th><th>Product</th><th>Qty</th><th>Date</th></tr></thead>
            <tbody>
              {completedOrders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.user.username}</td>
                  <td>{order.product.name}</td>
                  <td>{order.quantity}</td>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
