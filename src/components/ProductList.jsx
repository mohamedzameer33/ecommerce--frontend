import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext.jsx';
import { SearchContext } from '../App.jsx';
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const { user } = useContext(UserContext);
  const { searchQuery, setSearchQuery } = useContext(SearchContext);
  const navigate = useNavigate();

  // Custom simple debounce using useRef + setTimeout
  const debounceTimeout = useRef(null);

  const debouncedSetSearch = (value) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setSearchQuery(value);
    }, 350);
  };

  // Fetch products + polling
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get('https://ecommerce-backend-production-8455.up.railway.app/api/products');
        setProducts(res.data || []);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    const interval = setInterval(fetchProducts, 12000); // 12 seconds is safer

    if (!user) localStorage.removeItem('cart');

    return () => {
      clearInterval(interval);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [user]);

  // Filter + sort logic (runs when dependencies change)
  const applyFilters = useMemo(() => {
    let result = [...products];

    // Search (using debounced value from context)
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase?.includes(q)
      );
    }

    // Price
    result = result.filter(p => {
      const price = Number(p.price);
      return price >= (priceRange.min || 0) && price <= (priceRange.max || Infinity);
    });

    // Sort
    switch (sortOption) {
      case 'price-low':  result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'name-az':    result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-za':    result.sort((a, b) => b.name.localeCompare(a.name)); break;
      default: break;
    }

    return result;
  }, [products, searchQuery, sortOption, priceRange]);

  useEffect(() => {
    setFilteredProducts(applyFilters);
  }, [applyFilters]);

  // ─── Cart logic ────────────────────────────────────────────────────
  const getCartItem = (id) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.find(item => item.id === id);
  };

  const addToCart = (product, qty = 1) => {
    if (!user) {
      alert('Please login first');
      navigate('/login');
      return;
    }
    if (product.stock < qty) {
      alert(`Only ${product.stock} left in stock!`);
      return;
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(i => i.id === product.id);

    if (existing) {
      if (existing.quantity + qty > product.stock) {
        alert(`Cannot add more — only ${product.stock - existing.quantity} left`);
        return;
      }
      existing.quantity += qty;
    } else {
      cart.push({ ...product, quantity: qty });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Added ${qty} × ${product.name} to cart!`);
  };

  // ─── Wishlist logic ────────────────────────────────────────────────
  const toggleWishlist = (product) => {
    if (!user) {
      alert('Login required');
      navigate('/login');
      return;
    }

    let wl = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const idx = wl.findIndex(i => i.id === product.id);

    if (idx !== -1) {
      wl.splice(idx, 1);
      alert('Removed from wishlist');
    } else {
      wl.push(product);
      alert('Added to wishlist ♥');
    }

    localStorage.setItem('wishlist', JSON.stringify(wl));
  };

  const isWishlisted = (id) => {
    const wl = JSON.parse(localStorage.getItem('wishlist') || '[]');
    return wl.some(i => i.id === id);
  };

  // ─── Quick view ────────────────────────────────────────────────────
  const openQuickView = (product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root {
          --primary: #6366f1;
          --primary-dark: #4f46e5;
          --success: #10b981;
          --danger: #ef4444;
          --text: #1e293b;
          --text-light: #64748b;
          --bg: #f8fafc;
          --card: #ffffff;
          --border: #e2e8f0;
          --shadow: 0 10px 25px -5px rgba(0,0,0,0.08);
          --radius: 12px;
        }

        * { box-sizing: border-box; margin:0; padding:0; }

        .shop-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 1.5rem;
          background: var(--bg);
          min-height: 100vh;
        }

        .filter-toggle {
          display: none;
          width: 100%;
          padding: 0.9rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          margin-bottom: 1.5rem;
          cursor: pointer;
        }

        .filters {
          background: var(--card);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 80px;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.8rem;
        }

        .product-card {
          background: white;
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: transform 0.25s, box-shadow 0.25s;
        }

        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 35px -10px rgba(99,102,241,0.18);
        }

        .product-image-container {
          height: 260px;
          overflow: hidden;
          position: relative;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s;
        }

        .product-card:hover .product-image {
          transform: scale(1.08);
        }

        .wishlist-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255,255,255,0.9);
          border-radius: 50%;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
        }

        .wishlist-btn.active {
          background: #fee2e2;
          color: var(--danger);
        }

        .quick-view {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255,255,255,0.95);
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          font-weight: 600;
          color: var(--primary);
          cursor: pointer;
          opacity: 0;
          transition: all 0.3s;
        }

        .product-card:hover .quick-view {
          opacity: 1;
        }

        .product-info {
          padding: 1.25rem;
        }

        .product-name {
          font-size: 1.15rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
        }

        .product-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--success);
        }

        .add-to-cart-row {
          display: flex;
          gap: 0.8rem;
          margin-top: 1rem;
        }

        .quantity-input {
          width: 60px;
          text-align: center;
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 6px;
        }

        .btn-add {
          flex: 1;
          padding: 0.8rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-add:hover { background: var(--primary-dark); }
        .btn-add:disabled { background: #9ca3af; cursor: not-allowed; }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .modal-box {
          background: white;
          border-radius: 16px;
          max-width: 90%;
          width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.8rem;
          cursor: pointer;
          color: #6b7280;
        }

        /* Skeleton */
        .skeleton {
          background: var(--card);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          height: 480px;
        }

        .skeleton-img {
          height: 260px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (max-width: 1024px) {
          .shop-container { padding: 1rem; }
          .filter-toggle { display: block; }
          .filters { display: ${showFilters ? 'block' : 'none'}; position: relative; top: 0; }
        }

        @media (max-width: 640px) {
          .product-grid { grid-template-columns: 1fr; }
          .add-to-cart-row { flex-direction: column; }
          .quantity-input { width: 100%; }
        }
      `}</style>

      <div className="shop-container">
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters & Sort'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>
          <aside className="filters">
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Sort By</div>
              <select value={sortOption} onChange={e => setSortOption(e.target.value)}>
                <option value="default">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-az">Name A–Z</option>
                <option value="name-za">Name Z–A</option>
              </select>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Price Range</div>
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min || ''}
                onChange={e => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
              />
              <div style={{ height: 8 }} />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max === Infinity ? '' : priceRange.max}
                onChange={e => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || Infinity }))}
              />
            </div>
          </aside>

          <section>
            {loading ? (
              <div className="product-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton">
                    <div className="skeleton-img" />
                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ height: 20, width: '70%', background: '#e5e7eb', borderRadius: 4, marginBottom: 12 }} />
                      <div style={{ height: 16, width: '40%', background: '#e5e7eb', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--danger)' }}>{error}</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 1rem' }}>
                <h2>No products found</h2>
                <p>Try different filters or search term</p>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map(product => {
                  const cartItem = getCartItem(product.id);
                  const wishlisted = isWishlisted(product.id);
                  const outOfStock = product.stock <= 0;

                  return (
                    <div key={product.id} className="product-card">
                      <button
                        className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
                        onClick={() => toggleWishlist(product)}
                      >
                        {wishlisted ? '❤️' : '♡'}
                      </button>

                      <div className="product-image-container">
                        <img
                          src={product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                          alt={product.name}
                          className="product-image"
                        />
                      </div>

                      <div className="product-info">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-price">${Number(product.price).toFixed(2)}</div>

                        <div className="add-to-cart-row">
                          <input
                            type="number"
                            min="1"
                            max={product.stock}
                            defaultValue="1"
                            className="quantity-input"
                            disabled={outOfStock}
                          />
                          <button
                            className="btn-add"
                            disabled={outOfStock}
                            onClick={(e) => {
                              const qty = Number(e.target.previousSibling.value) || 1;
                              addToCart(product, qty);
                            }}
                          >
                            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        </div>

                        <button
                          className="quick-view"
                          onClick={() => openQuickView(product)}
                        >
                          Quick View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Quick View Modal */}
        {quickViewProduct && (
          <div className="modal-backdrop" onClick={closeQuickView}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{quickViewProduct.name}</h2>
                <button className="modal-close" onClick={closeQuickView}>×</button>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <img
                  src={quickViewProduct.imageUrl || 'https://via.placeholder.com/500x500'}
                  alt={quickViewProduct.name}
                  style={{ maxWidth: 400, borderRadius: 12, objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)' }}>
                    ${Number(quickViewProduct.price).toFixed(2)}
                  </div>
                  <p style={{ margin: '1rem 0', color: 'var(--text-light)' }}>
                    {quickViewProduct.description || 'No description available.'}
                  </p>
                  <p>Stock: {quickViewProduct.stock > 0 ? quickViewProduct.stock : 'Out of stock'}</p>

                  <button
                    style={{
                      marginTop: '1.5rem',
                      width: '100%',
                      padding: '1rem',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }}
                    onClick={() => {
                      addToCart(quickViewProduct, 1);
                      closeQuickView();
                    }}
                    disabled={quickViewProduct.stock <= 0}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductList;
