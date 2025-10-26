import React, { useState, useMemo, useRef, useEffect } from "react"; // Added useRef, useEffect
import { ShoppingCart, Trash2, LoaderCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import OrderHistory from "./OrderHistory"; // Import OrderHistory
import { getGuestId, getTableId } from "../utils/guest"; // Assuming these exist

// --- API instance ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api", // Fallback
});

const Cart = ({
  cart, // Cart items passed as prop
  // tableId & guestId are now fetched internally
  onClearCart, // Function to clear cart in parent state
  onRemoveItem, // Function to remove item in parent state
  onOrderPlaced, // Callback after order is placed
}) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const isSubmitting = useRef(false); // Ref for robust double submission prevention
  const [guestId, setGuestId] = useState(null);
  const [tableId, setTableId] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false); // To toggle history view

  // Fetch guestId and tableId on component mount
  useEffect(() => {
    setGuestId(getGuestId());
    setTableId(getTableId());
  }, []);

  // Calculate total price using useMemo for efficiency
  const totalPrice = useMemo(() => {
    // Defensive check: Ensure cart is an array before reducing
    if (!Array.isArray(cart)) {
      console.error("Cart prop is not an array!", cart);
      return 0;
    }
    return cart.reduce(
      (sum, item) =>
        sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );
  }, [cart]); // Dependency: only recalculate when cart changes

  const handlePlaceOrder = async () => {
    // --- Validation Checks ---
    if (!tableId) {
      toast.error("Invalid table ID. Scan a proper QR code.", { icon: "🚫" });
      return;
    }
    if (!guestId) {
      toast.error("Guest ID is missing.", { icon: "🚫" });
      return;
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      // Check if cart is array and not empty
      toast.error("Your cart is empty!");
      return;
    }

    // --- Robust Double Submission Check using useRef ---
    if (isSubmitting.current) {
      console.log("Submission already in progress via ref, returning.");
      return; // Already submitting
    }

    // Set both state (for UI updates) and ref (for logic lock)
    setIsPlacingOrder(true);
    isSubmitting.current = true;
    console.log("Set isPlacingOrder & isSubmitting ref to true");

    // --- Payload Creation ---
    const payload = {
      tableId,
      guestId,
      totalPrice,
      items: cart.map((item) => ({
        food: item.foodId, // Ensure 'foodId' is the correct ID field
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    console.log("Placing order with payload:", payload);

    try {
      const { data } = await api.post("/orders", payload);
      console.log("Order API response:", data);

      if (data && data.success) {
        toast.success("Order placed successfully! 🍽️");
        // Clear cart *after* success
        if (onClearCart) {
          onClearCart();
        }
        // Show order history after placing order
        setShowOrderHistory(true);
        // Trigger callback if provided
        if (onOrderPlaced) {
          onOrderPlaced(data.data); // Pass order data back if needed
        }
      } else {
        throw new Error(data?.message || "Failed to place order.");
      }
    } catch (err) {
      console.error("Error placing order:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred.";
      toast.error(message);
      // Explicitly reset ref on error to allow retries
      isSubmitting.current = false;
    } finally {
      // Always reset the UI loading state
      setIsPlacingOrder(false);
      // Reset ref in finally as well, ensures it's reset even if success callbacks fail
      isSubmitting.current = false;
      console.log("Set isPlacingOrder & isSubmitting ref back to false");
    }
  };

  // Callback for OrderHistory when it clears orders
  const handleOrdersCleared = () => {
    setShowOrderHistory(false);
  };

  // --- JSX Structure ---
  return (
    <div className="rounded-lg bg-[var(--surface-color)] p-5 shadow-lg ring-1 ring-black/5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <ShoppingCart size={20} className="text-[var(--primary-color)]" />
          Your Order
        </h3>
        <span className="rounded-full bg-[var(--primary-color)] px-3 py-0.5 text-sm font-semibold text-[var(--text-on-primary)]">
          Table: {tableId || "..."}
        </span>
      </div>

      {/* Cart Items List or Order History */}
      <div className="flex-grow overflow-y-auto py-1">
        {cart.length === 0 && !showOrderHistory ? (
          <p className="text-center text-sm text-[var(--text-color-secondary)] pt-4">
            Your cart is empty.
          </p>
        ) : cart.length > 0 ? ( // Only show cart items if cart is not empty
          <ul className="space-y-3">
            {cart.map((item, index) => (
              <li
                key={`${item.foodId}-${index}`} // Consider a more stable key if possible
                className="flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.name}</p>
                  <p className="text-sm text-[var(--text-color-secondary)]">
                    {item.quantity} x ₹{(Number(item.price) || 0).toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold whitespace-nowrap">
                  ₹
                  {(
                    (Number(item.quantity) || 0) * (Number(item.price) || 0)
                  ).toFixed(2)}
                </p>
                <button
                  onClick={() => onRemoveItem(item.foodId)} // Use parent's remove function
                  className="rounded-full p-1.5 text-red-500 hover:bg-red-100 transition-colors"
                  title="Remove item"
                  disabled={isPlacingOrder} // Disable remove while placing order
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}{" "}
        {/* Don't show empty UL if history is shown */}
        {/* Conditionally render OrderHistory */}
        {showOrderHistory && guestId && tableId && (
          <OrderHistory
            guestId={guestId}
            tableId={tableId}
            onOrdersCleared={handleOrdersCleared} // Pass callback to hide history
          />
        )}
      </div>

      {/* Footer - Only show if cart has items */}
      {cart.length > 0 && (
        <div className="border-t border-[var(--border-color)] pt-4 mt-4">
          <div className="mb-4 flex items-center justify-between text-xl font-bold">
            <span>Total:</span>
            <span className="text-[var(--primary-color-dark)]">
              ₹{totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handlePlaceOrder}
            // Disable button if placing order, no tableId, or cart is empty
            disabled={
              isPlacingOrder || !tableId || !guestId || cart.length === 0
            }
            className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-3.5 text-base font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 ${
              isPlacingOrder ? "bg-gray-400" : "bg-[var(--primary-color)]"
            }`}
          >
            {isPlacingOrder ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <ShoppingCart size={18} />
            )}
            {isPlacingOrder ? "Placing Order..." : "Confirm & Place Order"}
          </button>
          <button
            onClick={onClearCart} // Use parent's clear function
            disabled={isPlacingOrder} // Disable clear while placing order
            className="mt-2 w-full text-center text-sm text-[var(--text-color-secondary)] hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
