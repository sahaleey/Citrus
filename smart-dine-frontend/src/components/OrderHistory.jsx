import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-hot-toast";
import { Download, AlertTriangle, RefreshCw, Archive } from "lucide-react";
import { generateBillPDF } from "../utils/BillGenerator";

dayjs.extend(relativeTime);

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Helper to color the order status badges
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const intervalRef = useRef(null);

  // Fetch all guest orders
  const fetchMyOrders = async () => {
    if (!guestId || !tableId) return setLoading(false);

    if (isInitialLoad) setLoading(true);
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
      setIsInitialLoad(false);
    }
  };

  // Bill download and order removal
  const handleDownloadBill = async (order) => {
    if (loading) return;
    clearInterval(intervalRef.current);

    try {
      generateBillPDF([order]);
      await axios.delete(`${API_URL}/orders/${order._id}`);
      setOrders((prev) => prev.filter((o) => o._id !== order._id));

      toast.success("Bill downloaded and order cleared!");
      if (orders.length === 1) onOrdersCleared?.();
    } catch (err) {
      console.error("Failed to clear order:", err);
      toast.error("Failed to clear order. Please try again.");
    } finally {
      intervalRef.current = setInterval(fetchMyOrders, 5000);
    }
  };

  const handleCancelOrder = async (order) => {
    try {
      await axios.patch(`${API_URL}/orders/${order._id}/status`, {
        status: "Cancelled",
      });
      toast.success("Order cancelled successfully!");
      // update it in the UI immediately
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id ? { ...o, status: "Cancelled" } : o
        )
      );
    } catch (err) {
      console.error("Cancel failed:", err);
      toast.error("Failed to cancel order.");
    }
  };

  const handleAcknowledgeCancel = async (orderId) => {
    try {
      await axios.delete(`${API_URL}/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      toast.success("Order removed from history.");
    } catch (err) {
      console.error("Failed to remove order:", err);
      toast.error("Couldn't remove order from history.");
    }
  };

  // Fetch orders every 5 seconds
  useEffect(() => {
    fetchMyOrders();
    intervalRef.current = setInterval(fetchMyOrders, 5000);
    return () => clearInterval(intervalRef.current);
  }, [guestId, tableId]);

  // --- UI ---
  if (loading)
    return (
      <div className="p-4 text-center text-[var(--text-color-secondary)]">
        <p>Loading your order history...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center p-4 text-center bg-red-50 text-red-700 rounded-lg border border-red-200">
        <AlertTriangle size={24} className="mb-2" />
        <p className="font-semibold mb-2">Failed to load orders</p>
        <button
          onClick={fetchMyOrders}
          className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
        >
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="p-5 text-center text-[var(--text-color-secondary)]">
        <Archive
          size={24}
          className="mx-auto mb-2 text-[var(--text-color-secondary)]"
        />
        <p className="font-semibold">No Past Orders</p>
        <p className="text-xs">Your placed orders will appear here.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order._id}
          className="rounded-lg border border-[var(--border-color)] p-4 bg-[var(--surface-color)] shadow-sm"
        >
          <div className="flex justify-between items-center mb-2">
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

          <div className="flex justify-between text-xs text-[var(--text-color-secondary)]">
            <span>{dayjs(order.createdAt).fromNow()}</span>

            {order.status === "Served" && (
              <button
                onClick={() => handleDownloadBill(order)}
                className="flex items-center gap-1 rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-300"
              >
                <Download size={12} />
                Bill
              </button>
            )}

            {["Pending", "Preparing"].includes(order.status) && (
              <button
                onClick={() => handleCancelOrder(order)}
                className="flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
              >
                Cancel
              </button>
            )}

            {order.status === "Cancelled" && (
              <button
                onClick={() => handleAcknowledgeCancel(order._id)}
                className="flex items-center gap-1 rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
              >
                OK
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;
