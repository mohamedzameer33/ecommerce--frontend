import React, { useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { SearchContext } from "../App";
import { useNavigate } from "react-router-dom";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState("default");
  const [priceRange, setPriceRange] = useState([0, Infinity]);
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { user } = useContext(UserContext);
  const { searchQuery } = useContext(SearchContext);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(
        "https://ecommerce-backend-production-8455.up.railway.app/api/products"
      );
      setProducts(res.data);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch {
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 1000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  useEffect(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    switch (sortOption) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-az":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-za":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    setFilteredProducts(result);
  }, [searchQuery, sortOption, priceRange, products]);

  const addToCart = (product) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (product.stock <= 0) return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((i) => i.id === product.id);

    if (existing) {
      if (existing.quantity >= product.stock) return;
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
  };

  const getCartQuantity = (id) =>
    (JSON.parse(localStorage.getItem("cart")) || [])
      .find((i) => i.id === id)?.quantity || 0;

  const isInWishlist = (id) =>
    (JSON.parse(localStorage.getItem("wishlist")) || []).some(
      (i) => i.id === id
    );

  const toggleWishlist = (product) => {
    if (!user) {
      navigate("/login");
      return;
    }

    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const index = wishlist.findIndex((i) => i.id === product.id);

    if (index !== -1) wishlist.splice(index, 1);
    else wishlist.push(product);

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  };

  const clearFilters = () => {
    setSortOption("default");
    setPriceRange([0, Infinity]);
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial;
        }

        .shop-container {
          background: #f3f4f6;
          min-height: 100vh;
          padding: 1rem;
        }

        .top-bar {
          max-width: 1400px;
          margin: 0 auto 1rem auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.8rem;
        }

        .view-toggle {
          display: flex;
          gap: 0.5rem;
        }

        .view-btn {
          padding: 0.6rem 0.8rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: white;
          cursor: pointer;
          font-weight: 600;
        }

        .view-btn.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .clear-btn {
          padding: 0.6rem 0.8rem;
          border-radius: 8px;
          border: none;
          background: #e5e7eb;
          cursor: pointer;
          font-weight: 600;
        }

        .shop-layout {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 1.5rem;
        }

        .filters {
          background: white;
          padding: 1.2rem;
          border-radius: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          position: sticky;
          top: 20px;
          height: fit-content;
          transition: transform 0.3s ease;
        }

        .filter-title {
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 0.8rem;
        }

        .sort-select, .price-input {
          width: 100%;
          padding: 0.7rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          margin-bottom: 0.8rem;
        }

        .apply-btn {
          width: 100%;
          padding: 0.7rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .toggle-filter {
          display: none;
          width: 100%;
          padding: 0.7rem;
          margin-bottom: 1rem;
          border-radius: 10px;
          border: none;
          background: #e5e7eb;
          font-weight: 600;
          cursor: pointer;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.2rem;
        }

        .products-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .card {
          background: white;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
        }

        .list-card {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 1rem;
          padding: 1rem;
        }

        .wishlist {
          position: absolute;
          top: 10px;
          right: 10px;
          background: white;
          border: none;
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        .stock-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #16a34a;
          color: white;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .stock-badge.out {
          background: #dc2626;
        }

        .product-img {
          width: 100%;
          height: 220px;
          object-fit: cover;
        }

        .list-card .product-img {
          height: 180px;
          border-radius: 10px;
        }

        .card-body {
          padding: 1rem;
        }

        .p-name {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 0.3rem;
        }

        .p-desc {
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 0.6rem;
        }

        .p-price {
          font-size: 1.1rem;
          font-weight: 800;
          color: #16a34a;
          margin-bottom: 0.4rem;
        }

        .add-btn {
          width: 100%;
          padding: 0.7rem;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          font-weight: 700;
          cursor: pointer;
          position: relative;
        }

        .cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #dc2626;
          color: white;
          border-radius: 50%;
          padding: 2px 6px;
          font-size: 0.75rem;
        }

        .scroll-top {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          cursor: pointer;
          font-size: 1.2rem;
        }

        @media (max-width: 1024px) {
          .shop-layout {
            grid-template-columns: 1fr;
          }

          .filters {
            display: ${showFilters ? "block" : "none"};
          }

          .toggle-filter {
            display: block;
          }
        }

        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          }

          .list-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="shop-container">
        <div className="top-bar">
          <button
            className="toggle-filter"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              Grid
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
            <button className="clear-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <p style={{ marginBottom: "10px", color: "#6b7280" }}>
          Last updated: {lastUpdated || "just now"}
        </p>

        <div className="shop-layout">
          <aside className="filters">
            <div className="filter-title">Sort & Filter</div>

            <select
              className="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="default">Sort by</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-az">Name: A to Z</option>
              <option value="name-za">Name: Z to A</option>
            </select>

            <input
              type="number"
              placeholder="Min price"
              className="price-input"
              onChange={(e) =>
                setPriceRange([Number(e.target.value) || 0, priceRange[1]])
              }
            />

            <input
              type="number"
              placeholder="Max price"
              className="price-input"
              onChange={(e) =>
                setPriceRange([priceRange[0], Number(e.target.value) || Infinity])
              }
            />

            <button
              className="apply-btn"
              onClick={() => setShowFilters(false)}
            >
              Apply
            </button>
          </aside>

          <section
            className={viewMode === "grid" ? "products-grid" : "products-list"}
          >
            {loading ? (
              <p>Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <p>No products found.</p>
            ) : (
              filteredProducts.map((product) => {
                const qty = getCartQuantity(product.id);
                const out = product.stock <= 0;
                const wish = isInWishlist(product.id);

                return (
                  <div
                    key={product.id}
                    className={`card ${viewMode === "list" ? "list-card" : ""}`}
                  >
                    <span className={`stock-badge ${out ? "out" : ""}`}>
                      {out ? "Out of Stock" : "In Stock"}
                    </span>

                    <button
                      className="wishlist"
                      onClick={() => toggleWishlist(product)}
                    >
                      {wish ? "❤️" : "🤍"}
                    </button>

                    <img
                      src={
                        product.imageUrl ||
                        "https://via.placeholder.com/400x300?text=No+Image"
                      }
                      alt={product.name}
                      className="product-img"
                      loading="lazy"
                    />

                    <div className="card-body">
                      <div className="p-name">{product.name}</div>
                      <div className="p-desc">
                        {product.description || "No description available."}
                      </div>
                      <div className="p-price">
                        ${product.price.toFixed(2)}
                      </div>

                      <button
                        disabled={out}
                        className="add-btn"
                        onClick={() => addToCart(product)}
                      >
                        {out ? "Out of Stock" : "Add to Cart"}
                        {qty > 0 && <span className="cart-badge">{qty}</span>}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {showScrollTop && (
          <button
            className="scroll-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            ↑
          </button>
        )}
      </div>
    </>
  );
};

export default ProductList;
