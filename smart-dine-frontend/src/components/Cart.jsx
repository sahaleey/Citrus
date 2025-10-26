import React, { useState, useMemo } from "react";
import { ShoppingCart, Trash2, LoaderCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

// --- API instance ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api", // Fallback for local dev
});

const Cart = ({
  cart,
  tableId,
  guestId,
  onClearCart,
  onRemoveItem,
  onOrderPlaced,
}) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Calculate total price based solely on items currently in the cart state
  const totalPrice = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );
  }, [cart]);

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
    if (!cart || cart.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }
    // Prevent double submission
    if (isPlacingOrder) {
      console.log("Already placing order, returning early."); // <-- Add console log for debugging
      return;
    }

    setIsPlacingOrder(true);
    console.log("Set isPlacingOrder to true"); // <-- Add console log for debugging

    // --- Payload Creation ---
    const payload = {
      tableId,
      guestId,
      totalPrice,
      items: cart.map((item) => ({
        food: item.foodId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    console.log("Placing order with payload:", payload); // <-- Add console log for debugging

    try {
      const { data } = await api.post("/orders", payload);
      console.log("Order API response:", data); // <-- Add console log for debugging

      if (data && data.success) {
        toast.success("Order placed successfully! 🍽️");
        onClearCart();
        if (onOrderPlaced) {
          onOrderPlaced(data.data);
        }
      } else {
        throw new Error(data?.message || "Failed to place order.");
      }
    } catch (err) {
      console.error("Error placing order:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred while placing the order.";
      toast.error(message);
    } finally {
      setIsPlacingOrder(false); // Ensure loading state is always reset
      console.log("Set isPlacingOrder back to false"); // <-- Add console log for debugging
    }
  };

  // --- JSX Structure (Looks good) ---
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

      {/* Cart Items List */}
      <div className="flex-grow overflow-y-auto py-1">
        {cart.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-color-secondary)] pt-4">
            Your cart is empty.
          </p>
        ) : (
          <ul className="space-y-3">
            {cart.map((item, index) => (
              <li
                key={`${item.foodId}-${index}`}
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
                  onClick={() => onRemoveItem(item.foodId)}
                  className="rounded-full p-1.5 text-red-500 hover:bg-red-100 transition-colors"
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
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
            disabled={isPlacingOrder || !tableId || cart.length === 0}
            className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-3.5 text-base font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 ${
              isPlacingOrder ? "bg-gray-400" : "bg-[var(--primary-color)]" // Adjusted disabled style slightly
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
            onClick={onClearCart}
            disabled={isPlacingOrder}
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
