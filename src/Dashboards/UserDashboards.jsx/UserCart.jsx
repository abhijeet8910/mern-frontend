// src/components/UserCart.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import PlaceOrderSection from "../../components/PlaceOrderSection";

const UserCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);
  const [showPlaceAll, setShowPlaceAll] = useState(false);

  // Fetch cart items
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get("https://mern-backend-6rcr.onrender.com/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = (res.data.cart?.items || []).filter(i => i.product);
      setCartItems(items);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch cart items");
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Remove a single item
  const handleRemoveItem = async (productId) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `https://mern-backend-6rcr.onrender.com/api/cart/remove/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCartItems(items => items.filter(i => i.product._id !== productId));
    } catch (err) {
      console.error(err);
      setError("Failed to remove item from cart");
    }
  };

  // Build full image URL
  const getFullImageUrl = (path) => {
    if (!path) return "/placeholder.jpg";
    return path.startsWith("http")
      ? path
      : `https://mern-backend-6rcr.onrender.com/${path.startsWith("/") ? "" : "/uploads/"}${path}`;
  };

  if (error) return <p className="text-red-500">{error}</p>;

  // Calculate totals
  const totalAmount = cartItems
    .reduce((sum, i) => sum + i.quantity * (i.product.price || 0), 0)
    .toFixed(2);

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      {/* Header: title on left, amount+button on right */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Your Cart</h2>
        <div className="flex items-center space-x-4">
          <span className="text-lg text-gray-700">
            <span className="font-medium">Total:</span> <span className="text-green-600 font-semibold">₹{totalAmount}</span>
          </span>
          {!showPlaceAll && (
            <button
              onClick={() => setShowPlaceAll(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition duration-200"
            >
              Place All Orders
            </button>
          )}
        </div>
      </div>

      {cartItems.length > 0 ? (
        <>
          {/* Trigger order modal */}
          {showPlaceAll && (
            <PlaceOrderSection
              items={cartItems.map(i => ({ product: i.product._id, quantity: i.quantity }))}
              setOrderPlaced={() => {
                setCartItems([]);
                setShowPlaceAll(false);
              }}
              autoOpen={true}
              hideTrigger={true}
            />
          )}

          {/* Cart Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cartItems.map((item) => {
              const { product, quantity } = item;
              return (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between hover:shadow-lg transition-shadow"
                >
                  <div>
                    <div className="w-full h-40 bg-gray-50 flex items-center justify-center border rounded-md overflow-hidden mb-3">
                      <img
                        src={getFullImageUrl(product.imageUrl)}
                        alt={product.name}
                        className="h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.jpg";
                        }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{product.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-bold">₹{product.price?.toFixed(2)}</span>
                      <span className="text-gray-700 text-sm">x{quantity}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(product._id)}
                    className="mt-4 bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded transition duration-200 self-end"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-gray-500">Your cart is empty.</p>
      )}
    </section>
  );
};

export default UserCart;
