import React, { useState, useMemo } from "react";
import { ShoppingCart, Trash2, LoaderCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

// --- API instance ---
// Good practice! Ensure VITE_API_BASE_URL is set correctly in your .env file
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api", // Added a fallback for local dev
});

const Cart = ({
  cart,
  // foods = [], // Removed 'foods' prop as cart items should contain necessary info
  tableId,
  guestId,
  onClearCart,
  onRemoveItem,
  onOrderPlaced, // Callback passed from Menu.jsx
}) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Calculate total price based solely on items currently in the cart state
  const totalPrice = useMemo(() => {
    // Ensure item.price is a number before multiplying
    return cart.reduce(
      (sum, item) =>
        sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );
  }, [cart]); // Dependency is only 'cart' now

  const handlePlaceOrder = async () => {
    // --- Validation Checks (Good!) ---
    if (!tableId) {
      toast.error("Invalid table ID. Scan a proper QR code.", { icon: "🚫" });
      return;
    }
    if (!guestId) {
      toast.error("Guest ID is missing.", { icon: "🚫" });
      return;
    }
    if (!cart || cart.length === 0) {
      // Added check for cart being null/undefined too
      toast.error("Your cart is empty!");
      return;
    }
    // Prevent double submission (Good!)
    if (isPlacingOrder) return;

    setIsPlacingOrder(true);

    // --- Payload Creation ---
    // Using data directly from cart items - more reliable
    const payload = {
      tableId,
      guestId,
      totalPrice,
      items: cart.map((item) => ({
        food: item.foodId, // Assuming foodId is the correct reference ID
        name: item.name, // Using name from cart item
        price: item.price, // Using price from cart item
        quantity: item.quantity,
      })),
      // Note: Removed .filter(Boolean) as map should always return valid items now
    };

    try {
      const { data } = await api.post("/orders", payload);

      if (data && data.success) {
        // Check if data and data.success exist
        toast.success("Order placed successfully! 🍽️");
        onClearCart(); // Clear the cart in the parent state
        // --- Call the onOrderPlaced callback from the parent (Menu.jsx) ---
        if (onOrderPlaced) {
          onOrderPlaced(data.data); // Pass the newly created order data if needed
        }
      } else {
        // Use server message if available, otherwise generic error
        throw new Error(data?.message || "Failed to place order.");
      }
    } catch (err) {
      console.error("Error placing order:", err);
      // More robust error message extraction
      const message =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred while placing the order.";
      toast.error(message);
    } finally {
      setIsPlacingOrder(false); // Ensure loading state is always reset (Good!)
    }
  };

  // --- JSX Structure (Looks good) ---
  return (
    <div className="rounded-lg bg-[var(--surface-color)] p-5 shadow-lg ring-1 ring-black/5 flex flex-col h-full">
      {" "}
      {/* Added flex flex-col h-full */}
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4">
        {" "}
        {/* Added mb-4 */}
        <h3 className="text-xl font-bold flex items-center gap-2">
          <ShoppingCart size={20} className="text-[var(--primary-color)]" />
          Your Order
        </h3>
        <span className="rounded-full bg-[var(--primary-color)] px-3 py-0.5 text-sm font-semibold text-[var(--text-on-primary)]">
          Table: {tableId || "..."}
        </span>
      </div>
      {/* Cart Items List - Added flex-grow */}
      <div className="flex-grow overflow-y-auto py-1">
        {" "}
        {/* Adjusted padding */}
        {cart.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-color-secondary)] pt-4">
            {" "}
            {/* Added padding top */}
            Your cart is empty.
          </p>
        ) : (
          <ul className="space-y-3">
            {" "}
            {/* Reduced spacing slightly */}
            {cart.map((item, index) => (
              <li
                key={`${item.foodId}-${index}`} // Using index is okay if items don't reorder, but foodId should be unique enough
                className="flex items-center gap-3" // Adjusted gap
              >
                <div className="flex-1 min-w-0">
                  {" "}
                  {/* Added min-w-0 for text truncation */}
                  <p className="font-semibold truncate">{item.name}</p>{" "}
                  {/* Added truncate */}
                  <p className="text-sm text-[var(--text-color-secondary)]">
                    {item.quantity} x ₹{(Number(item.price) || 0).toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold whitespace-nowrap">
                  {" "}
                  {/* Prevent wrapping */}₹
                  {(
                    (Number(item.quantity) || 0) * (Number(item.price) || 0)
                  ).toFixed(2)}
                </p>
                <button
                  onClick={() => onRemoveItem(item.foodId)}
                  className="rounded-full p-1.5 text-red-500 hover:bg-red-100 transition-colors" // Slightly larger tap target
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Footer - Pushes to bottom */}
      {cart.length > 0 && (
        <div className="border-t border-[var(--border-color)] pt-4 mt-4">
          {" "}
          {/* Added mt-4 */}
          <div className="mb-4 flex items-center justify-between text-xl font-bold">
            <span>Total:</span>
            <span className="text-[var(--primary-color-dark)]">
              ₹{totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !tableId || cart.length === 0} // Also disable if cart is empty
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-4 py-3.5 text-base font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-gray-400" // Added disabled:opacity-70
          >
            {isPlacingOrder ? (
              <LoaderCircle size={18} className="animate-spin" /> // Ensure size matches ShoppingCart
            ) : (
              <ShoppingCart size={18} />
            )}
            {isPlacingOrder ? "Placing Order..." : "Confirm & Place Order"}
          </button>
          <button
            onClick={onClearCart}
            disabled={isPlacingOrder} // Disable clear cart while placing order
            className="mt-2 w-full text-center text-sm text-[var(--text-color-secondary)] hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed" // Added disabled styles
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
