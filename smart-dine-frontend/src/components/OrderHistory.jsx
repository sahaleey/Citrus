import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-hot-toast";
import { Download, AlertTriangle, RefreshCw, Archive } from "lucide-react";
import { generateBillPDF } from "../utils/BillGenerator";

dayjs.extend(relativeTime);

const API_URL =
  import.meta.env.VITE_API_URL || "https://citrus-c209.onrender.com/api";

// Status badge helper
const getStatusBadge = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Preparing":
      return "bg-blue-100 text-blue-800";
    case "Ready":
      return "bg-green-100 text-green-800";
    case "Served":
      return "bg-purple-100 text-purple-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const OrderHistory = ({ guestId, tableId, onOrdersCleared }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders for this guest
  const fetchMyOrders = async () => {
    if (!guestId || !tableId) return setLoading(false); // ensure both IDs exist
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(
        `${API_URL}/orders/my-orders?guestId=${guestId}&tableId=${tableId}`
      );
      if (data.success) setOrders(data.data);
      else throw new Error(data.message || "Failed to fetch orders.");
    } catch (err) {
      console.error("Failed to fetch guest orders:", err);
      setError(
        err.response?.data?.message || err.message || "Could not fetch orders."
      );
      toast.error("Could not fetch your order history.");
    } finally {
      setLoading(false);
    }
  };

  // Download bill & clear only this guest's orders
  const handleDownloadBill = async (order) => {
    // Prevent multiple clicks during processing
    if (loading) return;

    try {
      // 1. Generate PDF for this single order
      generateBillPDF([order]);

      // 2. Optimistically update UI (optional but improves UX)
      const prevOrders = orders;
      setOrders((prev) => prev.filter((o) => o._id !== order._id));

      // 3. Delete ONLY this order from backend
      await axios.delete(`${API_URL}/orders/${order._id}`);

      toast.success("Bill downloaded and order cleared!");

      // 4. Notify parent if ALL orders are now cleared
      if (prevOrders.length === 1) {
        onOrdersCleared?.();
      }
    } catch (err) {
      console.error("Failed to clear order:", err);
      toast.error("Failed to clear order. Please try again.");

      // 5. Revert optimistic update on error
      setOrders((prev) => {
        // Avoid duplicates: only add back if not already present
        if (!prev.some((o) => o._id === order._id)) {
          return [order, ...prev];
        }
        return prev;
      });
    }
  };
  useEffect(() => {
    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 5000); // auto-refresh every 50s
    return () => clearInterval(interval);
  }, [guestId, tableId]);

  if (loading)
    return (
      <div className="mt-6 rounded-lg bg-[var(--surface-color)] p-5 text-center shadow-lg ring-1 ring-black/5">
        <p className="text-sm text-[var(--text-color-secondary)]">
          Loading order history...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-5 text-center text-red-700">
        <AlertTriangle size={24} className="mb-2" />
        <h3 className="font-semibold">Failed to Load Orders</h3>
        <button
          onClick={fetchMyOrders}
          className="mt-2 rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          <RefreshCw size={14} className="inline-block mr-1" />
          Try Again
        </button>
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="mt-6 rounded-lg bg-[var(--surface-color)] p-5 text-center shadow-lg ring-1 ring-black/5">
        <Archive
          size={24}
          className="mx-auto text-[var(--text-color-secondary)] mb-2"
        />
        <p className="text-sm font-semibold">No Past Orders</p>
        <p className="text-xs text-[var(--text-color-secondary)]">
          Your placed orders will appear here.
        </p>
      </div>
    );

  return (
    <div className="mt-6 rounded-lg bg-[var(--surface-color)] p-5 shadow-lg ring-1 ring-black/5">
      <h3 className="text-xl font-bold mb-4">Your Order History</h3>

      <ul className="space-y-4 max-h-[40vh] overflow-y-auto">
        {orders.map((order) => (
          <li
            key={order._id}
            className="rounded-md border border-[var(--border-color)] p-3"
          >
            <div className="flex justify-between items-center">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(
                  order.status
                )}`}
              >
                {order.status}
              </span>
              <span className="text-sm font-bold text-[var(--primary-color-dark)]">
                ₹{order.totalPrice.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center mt-2 text-xs text-[var(--text-color-secondary)]">
              <span>{dayjs(order.createdAt).fromNow()}</span>

              {order.status === "Served" && (
                <button
                  onClick={() => handleDownloadBill(order)}
                  className="flex items-center gap-1 rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-300"
                  title="Download Bill & Clear Orders"
                >
                  <Download size={12} />
                  Bill
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrderHistory;
