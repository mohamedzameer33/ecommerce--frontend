import React, { useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { SearchContext } from "../App";
import { useNavigate } from "react-router-dom";

const API_URL =
  "https://ecommerce-backend-production-8455.up.railway.app/api/products";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState("default");
  const [priceRange, setPriceRange] = useState([0, Infinity]);
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const { user } = useContext(UserContext);
  const { searchQuery } = useContext(SearchContext);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    try {
      const res = await axios.get(API_URL);
      setProducts(res.data);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside
          className={`bg-white p-5 rounded-xl shadow-md transition-all ${
            showFilters ? "block" : "hidden lg:block"
          }`}
        >
          <h3 className="text-lg font-bold mb-4">Filters & Sort</h3>

          <select
            className="w-full border p-2 rounded mb-4"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="default">Sort by</option>
            <option value="price-low">Low to High</option>
            <option value="price-high">High to Low</option>
            <option value="name-az">A to Z</option>
            <option value="name-za">Z to A</option>
          </select>

          <div className="mb-4">
            <p className="font-semibold mb-2">Price Range</p>
            <input
              type="number"
              placeholder="Min"
              className="w-full border p-2 rounded mb-2"
              onChange={(e) =>
                setPriceRange([Number(e.target.value) || 0, priceRange[1]])
              }
            />
            <input
              type="number"
              placeholder="Max"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setPriceRange([priceRange[0], Number(e.target.value) || Infinity])
              }
            />
          </div>

          <button
            className="w-full bg-blue-600 text-white p-2 rounded"
            onClick={() => setShowFilters(false)}
          >
            Apply
          </button>
        </aside>

        <section>
          <button
            className="lg:hidden w-full bg-gray-200 p-2 rounded mb-4"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-500 mb-3">
            Last updated: {lastUpdated || "just now"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.length === 0 ? (
              <p className="col-span-full text-center text-gray-500">
                No products found.
              </p>
            ) : (
              filteredProducts.map((product) => {
                const qty = getCartQuantity(product.id);
                const out = product.stock <= 0;
                const wish = isInWishlist(product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow hover:shadow-xl transition-transform transform hover:-translate-y-1 overflow-hidden relative"
                  >
                    <button
                      className={`absolute top-3 right-3 bg-white p-2 rounded-full ${
                        wish ? "text-red-500" : "text-gray-400"
                      }`}
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
                      className="w-full h-56 object-cover"
                    />

                    <div className="p-4">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description || "No description available."}
                      </p>

                      <p className="text-green-600 font-bold mt-2">
                        ${product.price.toFixed(2)}
                      </p>

                      <p
                        className={`text-sm ${
                          out ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {out ? "Out of Stock" : `In Stock: ${product.stock}`}
                      </p>

                      {qty > 0 && (
                        <p className="text-sm text-blue-600 mt-1">
                          In cart: {qty}
                        </p>
                      )}

                      <button
                        disabled={out}
                        onClick={() => addToCart(product)}
                        className={`w-full mt-3 p-2 rounded text-white ${
                          out
                            ? "bg-gray-400"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {out ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductList;
