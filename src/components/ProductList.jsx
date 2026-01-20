import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext.jsx';
import { SearchContext } from '../App.jsx';
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const { user } = useContext(UserContext);
  const { searchQuery } = useContext(SearchContext);
  const navigate = useNavigate();

  const debounceTimeout = useRef(null);

  // ─── Fetch products ────────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get('https://ecommerce-backend-production-8455.up.railway.app/api/products');
        setProducts(res.data || []);
      } catch (err) {
        setError('Could not load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // gentle polling – 15 seconds
    const interval = setInterval(fetchProducts, 15000);
    return () => clearInterval(interval);
  }, []);

  // ─── Filtering & sorting ───────────────────────────────────────────
  const visibleProducts = useMemo(() => {
    let items = [...products];

    // search
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    // price range
    const min = Number(priceMin) || 0;
    const max = Number(priceMax) || Infinity;
    if (min || max < Infinity) {
      items = items.filter(p => {
        const price = Number(p.price);
        return price >= min && price <= max;
      });
    }

    // sort
    switch (sortOption) {
      case 'price-asc':   items.sort((a,b) => a.price - b.price); break;
      case 'price-desc':  items.sort((a,b) => b.price - a.price); break;
      case 'name-asc':    items.sort((a,b) => a.name.localeCompare(b.name)); break;
      case 'name-desc':   items.sort((a,b) => b.name.localeCompare(a.name)); break;
      default: break;
    }

    return items;
  }, [products, searchQuery, sortOption, priceMin, priceMax]);

  // ─── Cart & Wishlist helpers ──────────────────────────────────────
  const addToCart = (product) => {
    if (!user) {
      alert("Please log in first");
      navigate("/login");
      return;
    }

    if (product.stock <= 0) {
      alert("Out of stock");
      return;
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(i => i.id === product.id);

    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        alert(`Only ${product.stock} left`);
        return;
      }
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert("Added to cart");
  };

  const toggleWishlist = (product) => {
    if (!user) {
      alert("Please log in first");
      navigate("/login");
      return;
    }

    let wl = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const idx = wl.findIndex(i => i.id === product.id);

    if (idx !== -1) {
      wl.splice(idx, 1);
    } else {
      wl.push(product);
    }

    localStorage.setItem('wishlist', JSON.stringify(wl));
  };

  const isInWishlist = (id) => {
    const wl = JSON.parse(localStorage.getItem('wishlist') || '[]');
    return wl.some(i => i.id === id);
  };

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root {
          --bg:        #f8f9fc;
          --surface:   #ffffff;
          --text:      #1f2937;
          --text-soft: #6b7280;
          --border:    #e5e7eb;
          --primary:   #6366f1;
          --primary-d: #4f46e5;
          --success:   #10b981;
          --danger:    #ef4444;
          --radius:    10px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .shop-page {
          background: var(--bg);
          min-height: 100vh;
          padding: 1.5rem 1rem;
          font-family: system-ui, sans-serif;
          color: var(--text);
        }

        .shop-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 2rem;
        }

        /* ── Filters sidebar ────────────────────────────────────── */
        .filters-sidebar {
          background: var(--surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow-md);
          padding: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 1rem;
        }

        .filter-title {
          font-size: 1.15rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--text);
        }

        .filter-group {
          margin-bottom: 1.5rem;
        }

        select, input[type="number"] {
          width: 100%;
          padding: 0.7rem 0.9rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 0.95rem;
          background: white;
        }

        select:focus, input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }

        .mobile-filter-toggle {
          display: none;
          width: 100%;
          padding: 0.9rem;
          margin-bottom: 1.25rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-weight: 600;
          cursor: pointer;
        }

        /* ── Product grid ───────────────────────────────────────── */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.6rem;
        }

        .product {
          background: var(--surface);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: all 0.22s ease;
          position: relative;
        }

        .product:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }

        .product-image-wrapper {
          height: 240px;
          overflow: hidden;
          background: #f1f5f9;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .product:hover .product-image {
          transform: scale(1.06);
        }

        .wishlist-icon {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255,255,255,0.92);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
          font-size: 1.3rem;
          transition: all 0.2s;
        }

        .wishlist-icon.active {
          color: var(--danger);
        }

        .product-body {
          padding: 1.25rem;
        }

        .product-title {
          font-size: 1.08rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          line-height: 1.35;
        }

        .product-price {
          font-size: 1.22rem;
          font-weight: 700;
          color: var(--success);
          margin: 0.6rem 0 0.9rem;
        }

        .add-btn {
          width: 100%;
          padding: 0.8rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .add-btn:hover {
          background: var(--primary-d);
        }

        .add-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .out-of-stock {
          color: var(--danger);
          font-weight: 500;
          text-align: center;
          padding: 0.8rem;
        }

        .loading, .error-msg {
          text-align: center;
          padding: 6rem 1rem;
          color: var(--text-soft);
          font-size: 1.2rem;
        }

        .error-msg { color: var(--danger); }

        /* ── Responsive ─────────────────────────────────────────── */
        @media (max-width: 1024px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .filters-sidebar {
            position: relative;
            top: 0;
          }

          .mobile-filter-toggle {
            display: block;
          }

          .filters-sidebar {
            display: ${showFiltersMobile ? 'block' : 'none'};
          }
        }

        @media (max-width: 640px) {
          .products-grid {
            grid-template-columns: 1fr;
          }

          .product-image-wrapper {
            height: 220px;
          }
        }
      `}</style>

      <div className="shop-page">
        <div className="shop-container">

          <button
            className="mobile-filter-toggle"
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
          >
            {showFiltersMobile ? 'Hide filters' : 'Filters & sort'}
          </button>

          <div className="layout">
            {/* Sidebar filters */}
            <aside className="filters-sidebar">
              <div className="filter-group">
                <div className="filter-title">Sort by</div>
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value)}
                >
                  <option value="default">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name A–Z</option>
                  <option value="name-desc">Name Z–A</option>
                </select>
              </div>

              <div className="filter-group">
                <div className="filter-title">Price range</div>
                <input
                  type="number"
                  placeholder="Min price"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                />
                <div style={{ height: '12px' }} />
                <input
                  type="number"
                  placeholder="Max price"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                />
              </div>
            </aside>

            {/* Main products area */}
            <main>
              {loading ? (
                <div className="loading">Loading products…</div>
              ) : error ? (
                <div className="error-msg">{error}</div>
              ) : visibleProducts.length === 0 ? (
                <div className="loading" style={{ padding: '6rem 0' }}>
                  No products match your criteria
                </div>
              ) : (
                <div className="products-grid">
                  {visibleProducts.map(product => {
                    const inWishlist = isInWishlist(product.id);
                    const outOfStock = product.stock <= 0;

                    return (
                      <div key={product.id} className="product">
                        <button
                          className={`wishlist-icon ${inWishlist ? 'active' : ''}`}
                          onClick={() => toggleWishlist(product)}
                          title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          {inWishlist ? '❤️' : '♡'}
                        </button>

                        <div className="product-image-wrapper">
                          <img
                            src={product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                            alt={product.name}
                            className="product-image"
                            onError={e => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error'; }}
                          />
                        </div>

                        <div className="product-body">
                          <h3 className="product-title">{product.name}</h3>
                          <div className="product-price">
                            ${Number(product.price).toFixed(2)}
                          </div>

                          {outOfStock ? (
                            <div className="out-of-stock">Out of stock</div>
                          ) : (
                            <button
                              className="add-btn"
                              onClick={() => addToCart(product)}
                            >
                              Add to cart
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductList;
