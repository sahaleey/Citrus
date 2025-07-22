import React, { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  FiLock,
  FiPlus,
  FiClock,
  FiCheck,
  FiLoader,
  FiAlertTriangle,
} from "react-icons/fi";
import {
  FaUtensils,
  FaRegClock,
  FaFireAlt,
  FaCheckCircle,
} from "react-icons/fa";

dayjs.extend(relativeTime);

const statusFlow = ["pending", "preparing", "ready"];
const statusIcons = {
  pending: <FaRegClock className="text-yellow-500" />,
  preparing: <FiLoader className="text-blue-500 animate-spin" />,
  ready: <FaCheckCircle className="text-green-500" />,
};

const ChiefBoard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [newFood, setNewFood] = useState({
    name: "",
    price: "",
    quantityAvailable: "",
    offer: "",
    image: "",
    description: "",
    type: "",
  });

  const foodCategories = [
    "Starters",
    "Mains",
    "Desserts",
    "Drinks",
    "Specials",
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("chefToken");
      const res = await axios.get(
        "https://qrcodemenu-y983.onrender.com/api/orders",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const notifyBench = (tableId) => {
    toast.success(
      <div className="flex items-center gap-2">
        <FaFireAlt className="text-orange-500" />
        <span>Order for Table {tableId} is ready to serve!</span>
      </div>,
      { duration: 4000 }
    );
  };

  const updateStatus = async (id, currentStatus, tableId) => {
    const nextIndex = statusFlow.indexOf(currentStatus) + 1;
    if (nextIndex >= statusFlow.length) return;

    const newStatus = statusFlow[nextIndex];

    try {
      const token = localStorage.getItem("chefToken");
      await axios.patch(
        `https://qrcodemenu-y983.onrender.com/api/orders/${id}`,
        {
          status: newStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (newStatus === "ready") {
        notifyBench(tableId);
        await axios.delete(
          `https://qrcodemenu-y983.onrender.com/api/orders/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success(
          <div className="flex items-center gap-2">
            <FiCheck className="text-green-500" />
            <span>Order completed and removed from board!</span>
          </div>
        );
      } else {
        toast.success(
          <div className="flex items-center gap-2">
            {statusIcons[newStatus]}
            <span>Order marked as {newStatus}</span>
          </div>
        );
      }

      fetchOrders();
    } catch (err) {
      console.error("Failed to update/delete order:", err);
      toast.error(
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-red-500" />
          <span>Failed to update order status</span>
        </div>
      );
    }
  };

  const addFood = async () => {
    const { name, price, quantityAvailable, image, description, type } =
      newFood;
    if (
      !name ||
      !price ||
      !quantityAvailable ||
      !image ||
      !description ||
      !type
    ) {
      return toast.error(
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-red-500" />
          <span>Please fill all required fields</span>
        </div>
      );
    }

    try {
      const token = localStorage.getItem("chefToken");
      await axios.post(
        "https://qrcodemenu-y983.onrender.com/api/foods",
        newFood,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(
        <div className="flex items-center gap-2">
          <FiCheck className="text-green-500" />
          <span>New menu item added successfully!</span>
        </div>
      );
      setNewFood({
        name: "",
        price: "",
        quantityAvailable: "",
        offer: "",
        description: "",
        type: "",
        image: "",
      });
    } catch (err) {
      toast.error(
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-red-500" />
          <span>Failed to add new menu item</span>
        </div>
      );
      console.error(err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("chefToken");
    if (token) setAuthenticated(true);
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const filteredOrders = orders.filter((order) =>
    order.items.some(
      (item) =>
        item.foodId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.tableId.toString().includes(searchTerm)
    )
  );

  if (!authenticated) {
    const handleLogin = async () => {
      try {
        const res = await axios.post(
          "https://qrcodemenu-y983.onrender.com/api/auth/login",
          {
            password: inputPassword,
          }
        );

        if (res.data.success) {
          sessionStorage.setItem("chefToken", res.data.token);

          setAuthenticated(true);
        } else {
          throw new Error();
        }
      } catch (err) {
        toast.error(
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="text-red-500" />
            <span>Incorrect password. Try again.</span>
          </div>
        );
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-orange-200 max-w-md w-full mx-4">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-orange-100 p-4 rounded-full mb-4">
              <FiLock className="text-orange-600 text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Chef Authentication
            </h2>
            <p className="text-gray-500 mt-1">
              Enter password to access the dashboard
            </p>
          </div>

          <input
            type="password"
            placeholder="Enter your password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          />

          <button
            onClick={handleLogin}
            className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <FiLock />
            Unlock Dashboard
          </button>
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toaster position="top-right" />
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FaUtensils className="text-orange-500" />
              Chef Dashboard
            </h1>
            <p className="text-gray-500">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "orders"
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === "menu"
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Menu Management
            </button>
          </div>
        </div>
      </header>

      {activeTab === "orders" ? (
        <>
          {/* Orders Search and Filter */}
          <div className="mb-6 bg-white p-4 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search orders by table or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                <button className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium whitespace-nowrap">
                  All Orders
                </button>
                <button className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium whitespace-nowrap">
                  Pending
                </button>
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium whitespace-nowrap">
                  Preparing
                </button>
              </div>
            </div>
          </div>

          {/* Orders Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <FiClock className="text-orange-500 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">
                No active orders
              </h3>
              <p className="text-gray-500">
                New orders will appear here automatically
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition"
                >
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-gray-700">
                        Table #{order.tableId}
                      </span>
                      <span
                        className={`text-xs font-bold uppercase px-2 py-1 rounded-full flex items-center gap-1 ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "preparing"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {statusIcons[order.status]}
                        {order.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FiClock className="text-gray-400" />
                      Ordered {dayjs(order.createdAt).fromNow()}
                    </p>
                  </div>

                  <div className="p-4">
                    <ul className="space-y-3">
                      {order.items.map((item, i) => {
                        const food = item.foodId;
                        return (
                          <li
                            key={i}
                            className="pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                          >
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {food?.name || "Unknown Item"} × {item.quantity}
                              </span>
                              <span className="text-orange-600 font-medium">
                                ₹{(food?.price || 0) * item.quantity}
                              </span>
                            </div>
                            {food?.description && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {food.description}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        Total: ₹
                        {order.items.reduce(
                          (sum, item) =>
                            sum + (item.foodId?.price || 0) * item.quantity,
                          0
                        )}
                      </span>
                      {order.status !== "ready" && (
                        <button
                          onClick={() =>
                            updateStatus(order._id, order.status, order.tableId)
                          }
                          className={`px-3 py-1.5 text-sm font-medium rounded-full flex items-center gap-1 ${
                            order.status === "pending"
                              ? "bg-orange-500 hover:bg-orange-600 text-white"
                              : "bg-green-500 hover:bg-green-600 text-white"
                          }`}
                        >
                          {order.status === "pending" ? (
                            <>
                              <FiLoader className="animate-spin" />
                              Start Preparing
                            </>
                          ) : (
                            <>
                              <FiCheck />
                              Mark Ready
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <FiPlus className="text-orange-500" />
            Add New Menu Item
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Margherita Pizza"
                  value={newFood.name}
                  onChange={(e) =>
                    setNewFood({ ...newFood, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  placeholder="Describe the food item..."
                  value={newFood.description}
                  onChange={(e) =>
                    setNewFood({ ...newFood, description: e.target.value })
                  }
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newFood.price}
                      onChange={(e) =>
                        setNewFood({ ...newFood, price: e.target.value })
                      }
                      className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    placeholder="Available quantity"
                    value={newFood.quantityAvailable}
                    onChange={(e) =>
                      setNewFood({
                        ...newFood,
                        quantityAvailable: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={newFood.type}
                  onChange={(e) =>
                    setNewFood({ ...newFood, type: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                >
                  <option value="">Select type</option>
                  {foodCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Offer (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 10% off, Combo Deal"
                  value={newFood.offer}
                  onChange={(e) =>
                    setNewFood({ ...newFood, offer: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL *
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={newFood.image}
                  onChange={(e) =>
                    setNewFood({ ...newFood, image: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
                {newFood.image && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={newFood.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={addFood}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <FiPlus />
            Add to Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default ChiefBoard;
