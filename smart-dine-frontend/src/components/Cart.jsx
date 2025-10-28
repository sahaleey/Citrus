// src/components/Cart.jsx
import React, { useMemo } from "react";
import { ShoppingCart, Trash2, LoaderCircle } from "lucide-react";

// No more axios, toast, or useState!

const Cart = ({
  cart,
  tableId,
  onClearCart,
  onRemoveItem,
  onRequestPlaceOrder, // <-- This is the function from Menu.jsx
  isPlacingOrder, // <-- This is the state from Menu.jsx
}) => {
  // This logic is fine, it just calculates from props.
  const totalPrice = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0
    );
  }, [cart]);

  // ALL the handlePlaceOrder logic is GONE.
  // It's now handled by Menu.jsx.

  return (
    <div className="rounded-lg bg-[var(--surface-color)] p-5 shadow-lg ring-1 ring-black/5 flex flex-col h-full">
      {/* Header (No changes) */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <ShoppingCart size={20} className="text-[var(--primary-color)]" />
          Your Order
        </h3>
        <span className="rounded-full bg-[var(--primary-color)] px-3 py-0.5 text-sm font-semibold text-[var(--text-on-primary)]">
          Table: {tableId || "..."}
        </span>
      </div>

      {/* Cart Items List (No changes) */}
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

      {/* Footer (This is where the props are used) */}
      {cart.length > 0 && (
        <div className="border-t border-[var(--border-color)] pt-4 mt-4">
          <div className="mb-4 flex items-center justify-between text-xl font-bold">
            <span>Total:</span>
            <span className="text-[var(--primary-color-dark)]">
              ₹{totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={onRequestPlaceOrder} // <-- CHANGED: Uses the prop
            disabled={isPlacingOrder || !tableId || cart.length === 0} // <-- CHANGED: Uses the prop
            className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-3.5 text-base font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 ${
              isPlacingOrder ? "bg-gray-400" : "bg-[var(--primary-color)]" // <-- CHANGED: Uses the prop
            }`}
          >
            {isPlacingOrder ? ( // <-- CHANGED: Uses the prop
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <ShoppingCart size={18} />
            )}
            {isPlacingOrder ? "Placing Order..." : "Confirm & Place Order"}
          </button>
          <button
            onClick={onClearCart}
            disabled={isPlacingOrder} // <-- CHANGED: Uses the prop
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
