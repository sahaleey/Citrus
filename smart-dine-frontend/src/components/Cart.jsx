import React, { useState, useMemo } from "react";
import { ShoppingCart, Trash2, LoaderCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

// --- API instance ---
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

const Cart = ({
  cart,
  foods = [],
  tableId,
  guestId,
  onClearCart,
  onRemoveItem,
  onOrderPlaced, // receives callback from Menu.jsx
}) => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => {
      const foodItem = foods.find((f) => f._id === item.foodId);
      const price = item.price || foodItem?.price || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [cart, foods]);

  const handlePlaceOrder = async () => {
    if (!tableId) {
      toast.error("Invalid table ID. Scan a proper QR code.", { icon: "🚫" });
      return;
    }
    if (!guestId) {
      toast.error("Guest ID is missing.", { icon: "🚫" });
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    setIsPlacingOrder(true);

    const payload = {
      tableId,
      guestId,
      totalPrice,
      items: cart.map((item) => {
        const foodItem = foods.find((f) => f._id === item.foodId);
        return {
          food: item.foodId,
          name: item.name || foodItem?.name,
          price: item.price || foodItem?.price,
          quantity: item.quantity,
        };
      }),
    };

    try {
      const { data } = await api.post("/orders", payload);
      if (data.success) {
        toast.success("Order placed successfully! 🍽️");
        onOrderPlaced(cart); // pass the cart so Menu.jsx can clear it & update active orders
        onClearCart(); // auto-clear for next customer
      } else {
        throw new Error(data.message || "Failed to place order.");
      }
    } catch (err) {
      console.error("Error placing order:", err);
      toast.error(err.response?.data?.message || "Error placing order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="rounded-lg bg-[var(--surface-color)] p-5 shadow-lg ring-1 ring-black/5">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <ShoppingCart size={20} className="text-[var(--primary-color)]" />
          Your Order
        </h3>
        <span className="rounded-full bg-[var(--primary-color)] px-3 py-0.5 text-sm font-semibold text-[var(--text-on-primary)]">
          Table: {tableId || "..."}
        </span>
      </div>

      <div className="max-h-[50vh] overflow-y-auto py-4">
        {cart.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-color-secondary)]">
            Your cart is empty.
          </p>
        ) : (
          <ul className="space-y-4">
            {cart.map((item, index) => (
              <li
                key={`${item.foodId}-${index}`}
                className="flex items-center gap-4"
              >
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-[var(--text-color-secondary)]">
                    {item.quantity} x ₹{item.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold">
                  ₹{(item.quantity * item.price).toFixed(2)}
                </p>
                <button
                  onClick={() => onRemoveItem(item.foodId)}
                  className="rounded-full p-1 text-red-500 hover:bg-red-100"
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t border-[var(--border-color)] pt-4">
          <div className="mb-4 flex items-center justify-between text-xl font-bold">
            <span>Total:</span>
            <span className="text-[var(--primary-color-dark)]">
              ₹{totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !tableId}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-4 py-3.5 text-base font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isPlacingOrder ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <ShoppingCart size={18} />
            )}
            {isPlacingOrder ? "Placing Order..." : "Confirm & Place Order"}
          </button>
          <button
            onClick={onClearCart}
            className="mt-2 w-full text-center text-sm text-[var(--text-color-secondary)] hover:text-red-600"
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
