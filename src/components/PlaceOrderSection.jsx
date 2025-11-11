// src/components/PlaceOrderSection.jsx
import React, { useState, useEffect } from "react";
import ShippingForm from "./ShippingForm";
import axios from "axios";

const PlaceOrderSection = ({
  product,
  quantity,
  items,
  setOrderPlaced,
  autoOpen = false,
  hideTrigger = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placingOrder, setPlacingOrder] = useState(false);
  const token = localStorage.getItem("authToken");

  // Open modal automatically if requested
  useEffect(() => {
    if (autoOpen) setShowModal(true);
  }, [autoOpen]);

  // Build order items array
  const orderItems = items
    ? items.map(i => ({ product: i.product, quantity: i.quantity }))
    : product && quantity > 0
    ? [{ product: product._id, quantity }]
    : [];

  // Total amount calculation
  const totalAmount = items
    ? items.reduce((sum, i) => sum + i.quantity * (i.price || 0), 0)
    : product
    ? product.price * quantity
    : 0;

  const placeOrder = async (shippingInfo, paymentDetails = null) => {
    if (!orderItems.length) {
      alert("❌ No items to place order.");
      return;
    }
    try {
      setPlacingOrder(true);
      const orderData = {
        items: orderItems,
        shippingAddress: shippingInfo,
        seller: product?.seller || null,
        paymentMethod,
        ...(paymentDetails && { paymentDetails }),
      };

      const resp = await axios.post(
        "https://mern-backend-6rcr.onrender.com/api/orders/place",
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.data.success || resp.status === 200) {
        alert("✅ Order placed successfully!");
        setOrderPlaced(true);
        setShowModal(false);
      } else {
        alert(`❌ Order failed: ${resp.data.message}`);
      }
    } catch (err) {
      console.error("❌ Order placement failed:", err.response?.data || err);
      const msg = err.response?.data?.message || "Failed to place order. Please try again.";
      alert(`❌ ${msg}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleRazorpayPayment = async (shippingInfo) => {
    try {
      const { data } = await axios.post(
        "https://mern-backend-6rcr.onrender.com/api/orders/create-payment",
        { amount: totalAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order: razorOrder } = data;
      const options = {
        key: "rzp_test_LnsqP2mudQkRI8",
        amount: razorOrder.amount,
        currency: razorOrder.currency,
        order_id: razorOrder.id,
        handler: async (response) => {
          const paymentDetails = {
            razorpayOrderId: razorOrder.id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          };
          await placeOrder(shippingInfo, paymentDetails);
        },
        prefill: shippingInfo,
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("❌ Razorpay error:", err);
      alert("❌ Payment failed. Please try again.");
    }
  };

  const handleShippingSubmit = async (info) => {
    if (paymentMethod === "COD") {
      await placeOrder(info);
    } else {
      await handleRazorpayPayment(info);
    }
  };

  return (
    <>
      {!hideTrigger && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition duration-200"
        >
          Place Order{
            items ? ` (${items.length} items)` : ""
          }
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl"
            >
              &times;
            </button>

            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Shipping & Payment
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              >
                <option value="COD">Cash on Delivery</option>
                <option value="Online">Online Payment</option>
              </select>
            </div>

            <ShippingForm
              onSubmit={handleShippingSubmit}
              isSubmitting={placingOrder}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PlaceOrderSection;
