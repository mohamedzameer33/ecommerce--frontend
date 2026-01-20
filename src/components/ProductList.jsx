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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState(null);

  const { user } = useContext(UserContext);
  const { searchQuery } = useContext(SearchContext);
  const navigate = useNavigate();

  const debounceRef = useRef(null);

  // Fetch + gentle polling
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get('https://ecommerce-backend-production-8455.up.railway.app/api/products');
        setProducts(data || []);
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
    const timer = setInterval(loadProducts, 15000);
    return () => clearInterval(timer);
  }, []);

  // ─── Filtering & sorting ───────────────────────────────────────────
  const displayedProducts = useMemo(() => {
    let list = [...products];

    // Search
    if (searchQuery?.trim()) {
      const term = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    // Price range
    const minVal = Number(priceMin) || 0;
    const maxVal = Number(priceMax) || Infinity;
    list = list.filter(p => {
      const price = Number(p.price);
      return price >= minVal && price <= maxVal;
    });

    // Sort
    switch (sortOption) {
      case 'price-asc':   list.sort((a,b) => a.price - b.price); break;
      case 'price-desc':  list.sort((a,b) => b.price - a.price); break;
      case 'name-asc':    list.sort((a,b) => a.name.localeCompare(b.name)); break;
      case 'name-desc':   list.sort((a,b) => b.name.localeCompare(a.name)); break;
      default: break;
    }

    return list;
  }, [products, searchQuery, sortOption, priceMin, priceMax]);

  // ─── Cart helpers ──────────────────────────────────────────────────
  const getCartQty = (id) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.find(i => i.id === id)?.quantity || 0;
  };

  const addToCart = (product) => {
    if (!user) {
      alert('Please log in first');
      navigate('/login');
      return;
    }

    if (product.stock <= 0) {
      alert('Out of stock');
      return;
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(i => i.id === product.id);

    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        alert(`Only ${product.stock - existing.quantity} left`);
        return;
      }
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
  };

  // ─── Wishlist helpers ──────────────────────────────────────────────
  const isWishlisted = (id) => {
    const list = JSON.parse(localStorage.getItem('wishlist') || '[]');
    return list.some(item => item.id === id);
  };

  const toggleWishlist = (product) => {
    if (!user) {
      alert('Please log in first');
      navigate('/login');
      return;
    }

    let list = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const idx = list.findIndex(i => i.id === product.id);

    if (idx !== -1) {
      list.splice(idx, 1);
    } else {
      list.push(product);
    }

    localStorage.setItem('wishlist', JSON.stringify(list));
  };

  // ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        :root {
          --bg:           #f9fafb;
          --surface:      #ffffff;
          --text:         #111827;
          --text-light:   #6b7280;
          --border:       #e5e7eb;
          --primary:      #6366f1;
          --primary-dark: #4f46e5;
          --success:      #10b981;
          --danger:       #ef4444;
          --radius:       12px;
          --shadow:       0 4px 12px rgba(0,0,0,0.06);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .shop-wrapper {
          background: var(--bg);
          min-height: 100vh;
          padding: 1.5rem 1rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .shop-content {
          max-width: 1440px;
          margin: 0 auto;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
        }

        /* Filters sidebar */
        .filters-column {
          background: var(--surface);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 1rem;
        }

        .filter-heading {
          font-size: 1.18rem;
          font-weight: 600;
          margin-bottom: 1.1rem;
          color: var(--text);
        }

        .filter-block + .filter-block {
          margin-top: 1.6rem;
        }

        select, input[type="number"] {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 0.97rem;
          background: #fff;
        }

        select:focus, input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.14);
        }

        .mobile-filters-btn {
          display: none;
          width: 100%;
          padding: 0.9rem;
          margin-bottom: 1.25rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
        }

        /* Product grid */
        .products-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
          gap: 1.8rem;
        }

        .product-item {
          background: var(--surface);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: all 0.22s ease;
          position: relative;
        }

        .product-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.09);
        }

        .image-container {
          height: 245px;
          background: #f1f5f9;
          overflow: hidden;
        }

        .product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }

        .product-item:hover .product-img {
          transform: scale(1.07);
        }

        .wishlist-heart {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 38px;
          height: 38px;
          background: rgba(255,255,255,0.94);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          font-size: 1.4rem;
          transition: all 0.18s;
        }

        .wishlist-heart.active {
          background: #fee2e2;
          color: #ef4444;
        }

        .product-content {
          padding: 1.25rem;
        }

        .product-name {
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.35;
          margin-bottom: 0.6rem;
          color: var(--text);
        }

        .product-price {
          font-size: 1.28rem;
          font-weight: 700;
          color: var(--success);
          margin-bottom: 0.9rem;
        }

        .stock-text {
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .stock-available {
          color: var(--success);
        }

        .stock-empty {
          color: var(--danger);
          font-weight: 500;
        }

        .cart-qty-badge {
          position: absolute;
          top: -6px;
          right: -10px;
          background: var(--danger);
          color: white;
          font-size: 0.72rem;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }

        .add-cart-button {
          width: 100%;
          padding: 0.82rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-weight: 600;
          font-size: 0.97rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .add-cart-button:hover:not(:disabled) {
          background: var(--primary-dark);
        }

        .add-cart-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        /* Quick view modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .modal-window {
          background: white;
          border-radius: 14px;
          width: 90%;
          max-width: 920px;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0,0,0,0.25);
        }

        .modal-header {
          padding: 1.4rem 1.8rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 1.4rem;
          font-weight: 600;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          color: var(--text-light);
          cursor: pointer;
        }

        .modal-body {
          padding: 1.8rem;
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .modal-image {
          flex: 1 1 380px;
          max-width: 420px;
          border-radius: 10px;
          object-fit: cover;
        }

        .modal-info {
          flex: 1 1 400px;
        }

        .modal-price {
          font-size: 1.9rem;
          font-weight: 700;
          color: var(--success);
          margin: 0.8rem 0 1.2rem;
        }

        .modal-desc {
          color: var(--text-light);
          line-height: 1.6;
          margin-bottom: 1.4rem;
        }

        .modal-stock {
          font-weight: 500;
          margin-bottom: 1.6rem;
        }

        .modal-add-btn {
          width: 100%;
          padding: 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
        }

        .modal-add-btn:hover {
          background: var(--primary-dark);
        }

        .modal-add-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        /* Loading / Error */
        .status-message {
          text-align: center;
          padding: 8rem 1rem;
          color: var(--text-light);
          font-size: 1.25rem;
        }

        .error-text {
          color: var(--danger);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .layout-grid {
            grid-template-columns: 1fr;
          }

          .filters-column {
            position: relative;
            top: 0;
          }

          .mobile-filters-btn {
            display: block;
          }

          .filters-column {
            display: ${showMobileFilters ? 'block' : 'none'};
          }
        }

        @media (max-width: 640px) {
          .products-container {
            grid-template-columns: 1fr;
          }

          .image-container {
            height: 220px;
          }

          .modal-body {
            flex-direction: column;
            gap: 1.5rem;
          }
        }
      `}</style>

      <div className="shop-wrapper">
        <div className="shop-content">

          <button
            className="mobile-filters-btn"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            {showMobileFilters ? 'Hide Filters' : 'Filters & Sorting'}
          </button>

          <div className="layout-grid">

            {/* Filters sidebar */}
            <aside className="filters-column">
              <div className="filter-block">
                <div className="filter-heading">Sort by</div>
                <select value={sortOption} onChange={e => setSortOption(e.target.value)}>
                  <option value="default">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>

              <div className="filter-block">
                <div className="filter-heading">Price range</div>
                <input
                  type="number"
                  placeholder="Min price"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                />
                <div style={{ height: '14px' }} />
                <input
                  type="number"
                  placeholder="Max price"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                />
              </div>
            </aside>

            {/* Products */}
            <section>
              {loading ? (
                <div className="status-message">Loading products...</div>
              ) : error ? (
                <div className="status-message error-text">{error}</div>
              ) : displayedProducts.length === 0 ? (
                <div className="status-message">No matching products found</div>
              ) : (
                <div className="products-container">
                  {displayedProducts.map(product => {
                    const cartCount = getCartQty(product.id);
                    const wishlisted = isWishlisted(product.id);
                    const noStock = product.stock <= 0;

                    return (
                      <div key={product.id} className="product-item">
                        <button
                          className={`wishlist-heart ${wishlisted ? 'active' : ''}`}
                          onClick={() => toggleWishlist(product)}
                          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          {wishlisted ? '❤️' : '♡'}
                        </button>

                        {cartCount > 0 && (
                          <span className="cart-qty-badge">{cartCount}</span>
                        )}

                        <div className="image-container">
                          <img
                            src={product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                            alt={product.name}
                            className="product-img"
                          />
                        </div>

                        <div className="product-content">
                          <h3 className="product-name">{product.name}</h3>
                          <div className="product-price">
                            ${Number(product.price).toFixed(2)}
                          </div>

                          <div className={`stock-text ${noStock ? 'stock-empty' : 'stock-available'}`}>
                            {noStock ? 'Out of stock' : `Stock: ${product.stock}`}
                          </div>

                          {noStock ? (
                            <div style={{ color: 'var(--danger)', fontWeight: 500, textAlign: 'center' }}>
                              Out of stock
                            </div>
                          ) : (
                            <button
                              className="add-cart-button"
                              onClick={() => addToCart(product)}
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Quick View Modal */}
        {quickViewItem && (
          <div className="modal-overlay" onClick={() => setQuickViewItem(null)}>
            <div className="modal-window" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{quickViewItem.name}</h2>
                <button className="modal-close-btn" onClick={() => setQuickViewItem(null)}>×</button>
              </div>

              <div className="modal-body">
                <img
                  src={quickViewItem.imageUrl || 'https://via.placeholder.com/500x500'}
                  alt={quickViewItem.name}
                  className="modal-image"
                />

                <div className="modal-info">
                  <div className="modal-price">
                    ${Number(quickViewItem.price).toFixed(2)}
                  </div>

                  <p className="modal-desc">
                    {quickViewItem.description || 'No description available.'}
                  </p>

                  <div className="modal-stock">
                    {quickViewItem.stock > 0
                      ? `In stock: ${quickViewItem.stock} pieces`
                      : <span style={{ color: 'var(--danger)' }}>Out of stock</span>}
                  </div>

                  <button
                    className="modal-add-btn"
                    onClick={() => {
                      addToCart(quickViewItem);
                      setQuickViewItem(null);
                    }}
                    disabled={quickViewItem.stock <= 0}
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
