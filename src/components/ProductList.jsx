import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext.jsx';
import { SearchContext } from '../App.jsx'; // Assuming App is where SearchContext is created; adjust path if needed
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [priceRange, setPriceRange] = useState([0, Infinity]);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useContext(UserContext);
  const { searchQuery } = useContext(SearchContext); // Use shared searchQuery from context
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('http://localhost:8080/api/products');
        setProducts(res.data);
        setFilteredProducts(res.data);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    if (!user) {
      localStorage.removeItem('cart');
    }
  }, [user]);

  useEffect(() => {
    let result = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortOption) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    setFilteredProducts(result);
  }, [searchQuery, sortOption, priceRange, products]);

  const addToCart = (product) => {
    if (!user) {
      alert('Please login to add to cart');
      navigate('/login');
      return;
    }
    if (product.stock <= 0) {
      alert('Out of stock!');
      return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        alert(`Only ${product.stock} in stock!`);
        return;
      }
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
  };

  const getCartQuantity = (productId) => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const getTotalCartItems = () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const toggleWishlist = (product) => {
    if (!user) {
      alert('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const index = wishlist.findIndex(item => item.id === product.id);

    if (index !== -1) {
      wishlist.splice(index, 1);
      alert('Removed from wishlist');
    } else {
      wishlist.push(product);
      alert('Added to wishlist');
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  };

  const isInWishlist = (productId) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    return wishlist.some(item => item.id === productId);
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .ecommerce-container {
          background: #f9fafb;
          min-height: 100vh;
        }

        .ecommerce-header {
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 1rem;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .search-bar {
          flex: 1;
          max-width: 600px;
          position: relative;
        }

        .search-input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 3rem;
          border: 1px solid #d1d5db;
          border-radius: 999px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
          outline: none;
        }

        .search-icon {
          position: absolute;
          left: 1.2rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-size: 1.3rem;
          pointer-events: none;
        }

        .cart-icon {
          position: relative;
          cursor: pointer;
          color: #1f2937;
          font-size: 1.6rem;
          display: flex;
          align-items: center;
        }

        .cart-count {
          position: absolute;
          top: -0.4rem;
          right: -0.6rem;
          background: #ef4444;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.15rem 0.45rem;
          border-radius: 999px;
          min-width: 1.2rem;
          text-align: center;
        }

        .filters-sidebar {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          position: sticky;
          top: 80px;
          height: fit-content;
        }

        .filter-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #374151;
        }

        .sort-select {
          width: 100%;
          padding: 0.7rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
          cursor: pointer;
        }

        .price-range {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .price-input {
          width: 100%;
          padding: 0.7rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }

        .price-input:focus {
          border-color: #3b82f6;
          outline: none;
        }

        .apply-filters {
          width: 100%;
          padding: 0.8rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .apply-filters:hover {
          background: #2563eb;
        }

        .filter-toggle-btn {
          display: none;
          width: 100%;
          padding: 0.8rem;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .shop-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1rem;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 2.5rem;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }

        .product-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          position: relative;
        }

        .product-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          transform: translateY(-4px);
        }

        .wishlist-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255,255,255,0.9);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          color: #9ca3af;
        }

        .wishlist-btn.active {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
        }

        .wishlist-btn:hover {
          color: #ef4444;
          background: rgba(239,68,68,0.1);
        }

        .product-image {
          width: 100%;
          height: 240px;
          object-fit: cover;
          display: block;
        }

        .product-details {
          padding: 1.5rem;
        }

        .product-name {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .product-description {
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 1rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #16a34a;
          margin-bottom: 0.75rem;
        }

        .product-rating {
          font-size: 0.85rem;
          color: #eab308;
          margin-bottom: 1rem;
        }

        .stock-info {
          font-size: 0.85rem;
          color: #16a34a;
          margin-bottom: 1.25rem;
        }

        .stock-info.out-of-stock {
          color: #ef4444;
        }

        .add-to-cart-btn {
          width: 100%;
          padding: 0.8rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }

        .add-to-cart-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .add-to-cart-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }

        /* Enhanced responsiveness */
        @media (max-width: 1024px) {
          .shop-main {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .filters-sidebar {
            display: ${showFilters ? 'block' : 'none'};
            position: relative;
            top: 0;
            box-shadow: none;
            border: 1px solid #e5e7eb;
          }

          .filter-toggle-btn {
            display: block;
          }
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: row;
            justify-content: space-between;
          }

          .search-bar {
            max-width: none;
            flex: 1;
          }

          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 1.5rem;
          }

          .product-image {
            height: 220px;
          }
        }

        @media (max-width: 480px) {
          .header-content {
            gap: 0.5rem;
          }

          .search-input {
            padding-left: 2.5rem;
            font-size: 0.95rem;
          }

          .search-icon {
            left: 0.8rem;
            font-size: 1.1rem;
          }

          .cart-icon {
            font-size: 1.4rem;
          }

          .product-grid {
            grid-template-columns: 1fr;
            gap: 1.2rem;
          }

          .product-image {
            height: 200px;
          }

          .product-details {
            padding: 1.2rem;
          }

          .price-range {
            gap: 0.5rem;
          }
        }
      `}</style>

      <div className="ecommerce-container">
        
        <main className="shop-main">
          <aside className="filters-sidebar">
            <h3 className="filter-title">Sort & Filter</h3>
            <select
              className="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="default">Sort by</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-az">Name: A-Z</option>
              <option value="name-za">Name: Z-A</option>
            </select>
            <div className="filter-title">Price Range</div>
            <div className="price-range">
              <input
                type="number"
                placeholder="Min price"
                className="price-input"
                value={priceRange[0] || ''}
                onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
              />
              <input
                type="number"
                placeholder="Max price"
                className="price-input"
                value={priceRange[1] === Infinity ? '' : priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || Infinity])}
              />
            </div>
            <button className="apply-filters" onClick={() => setShowFilters(false)}>
              Apply
            </button>
          </aside>

          <section>
            <button 
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Filters & Sort'} ⚙️
            </button>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
              <div className="loading-spinner">Loading products...</div>
            ) : (
              <div className="product-grid">
                {filteredProducts.length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>No products found.</p>
                ) : (
                  filteredProducts.map(product => {
                    const cartQty = getCartQuantity(product.id);
                    const isOutOfStock = product.stock <= 0;
                    const inWishlist = isInWishlist(product.id);

                    return (
                      <div key={product.id} className="product-card">
                        <button 
                          className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
                          onClick={() => toggleWishlist(product)}
                        >
                          {inWishlist ? '❤️' : '♡'}
                        </button>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="product-image"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                          />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                        <div className="product-details">
                          <h3 className="product-name">{product.name}</h3>
                          <p className="product-description">{product.description || 'No description available.'}</p>
                          <p className="product-price">${product.price.toFixed(2)}</p>
                          <p className="product-rating">★★★★☆ (4.5 / 5)</p>
                          <p className={`stock-info ${isOutOfStock ? 'out-of-stock' : ''}`}>
                            {isOutOfStock ? 'Out of Stock' : `In Stock: ${product.stock}`}
                          </p>
                          {cartQty > 0 && (
                            <p className="cart-quantity">In cart: {cartQty}</p>
                          )}
                          <button
                            onClick={() => addToCart(product)}
                            disabled={isOutOfStock}
                            className="add-to-cart-btn"
                          >
                            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
};

export default ProductList;