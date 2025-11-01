// src/components/OrderHistoryDrawer.jsx
import React, { useState, useEffect } from "react";
import { Archive, X, History } from "lucide-react";
import axios from "axios";
import OrderHistory from "../components/OrderHistory";

export default function OrderHistoryDrawer({
  guestId,
  tableId,
  onOrdersCleared,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

  const API_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  // ✅ Fetch active order count only
  const fetchOrderCount = async () => {
    if (!guestId || !tableId) return;

    try {
      const { data } = await axios.get(
        `${API_URL}/orders/my-orders?guestId=${guestId}&tableId=${tableId}`
      );

      if (data.success && Array.isArray(data.data)) {
        // count only ongoing or pending orders
        const activeOrders = data.data.filter(
          (order) =>
            order.status !== "Served" &&
            order.status !== "Cancelled" &&
            order.status !== "Completed"
        );
        setOrderCount(activeOrders.length);
      } else {
        setOrderCount(0);
      }
    } catch (err) {
      console.error("Error fetching order count:", err);
      setOrderCount(0);
    }
  };

  // ✅ Auto refresh every 4s
  useEffect(() => {
    fetchOrderCount();
    const interval = setInterval(fetchOrderCount, 4000);
    return () => clearInterval(interval);
  }, [guestId, tableId]);

  return (
    <>
      {/* Mobile Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-24 right-6 z-[9990] bg-[#3a9c6c] text-white p-4 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 group"
        aria-label="View order history"
      >
        <Archive size={22} />
        {orderCount > 0 && (
          <div className="absolute -top-2 -right-2 min-w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold px-1 shadow-lg">
            {orderCount}
          </div>
        )}
      </button>

      {/* Overlay + Drawer */}
      <div
        className={`fixed inset-0 z-[9999] ${isOpen ? "block" : "hidden"}`}
        aria-hidden={!isOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />

        {/* Bottom Sheet Drawer */}
        <div
          className={`absolute left-0 right-0 bottom-0 mx-auto w-full max-w-4xl rounded-t-3xl bg-white shadow-2xl transform transition-transform duration-500 ease-out ${
            isOpen ? "translate-y-0" : "translate-y-full"
          } border border-gray-100`}
          style={{ maxHeight: "85vh" }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#3a9c6c] rounded-xl">
                <Archive size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Order History
                </h3>
                <p className="text-sm text-gray-500">
                  Track your current orders
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200 group"
              aria-label="Close order history"
            >
              <X
                size={20}
                className="text-gray-500 group-hover:text-gray-700"
              />
            </button>
          </div>

          {/* Content */}
          <div
            className="p-6 overflow-y-auto"
            style={{ maxHeight: "calc(85vh - 140px)" }}
          >
            <OrderHistory
              guestId={guestId}
              tableId={tableId}
              onOrdersCleared={() => {
                setIsOpen(false);
                onOrdersCleared?.();
                fetchOrderCount();
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
