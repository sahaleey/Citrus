// src/components/chef/ChiefDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FiTrash2,
  FiTag,
  FiSearch,
  FiLogOut,
} from "react-icons/fi";
import {
  FaUtensils,
  FaRegClock,
  FaFireAlt,
  FaCheckCircle,
  FaLeaf,
  FaWineGlassAlt,
  FaIceCream,
  FaHamburger,
} from "react-icons/fa";

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

// Constants
const ORDER_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
};

const STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
];

const STATUS_ICONS = {
  [ORDER_STATUS.PENDING]: <FaRegClock className="text-yellow-500" />,
  [ORDER_STATUS.PREPARING]: <FiLoader className="text-blue-500 animate-spin" />,
  [ORDER_STATUS.READY]: <FaCheckCircle className="text-green-500" />,
};

const FOOD_CATEGORIES = ["Starters", "Mains", "Desserts", "Drinks", "Specials"];
const FOOD_TYPES = ["Veg", "Non-Veg", "Vegan", "Gluten-Free"];

// API Configuration
const API_BASE_URL = "https://qrcodemenu-y983.onrender.com/api";
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Utility Functions
const getTypeIcon = (type) => {
  switch (type) {
    case "Veg":
      return <FaLeaf className="text-green-500" />;
    case "Non-Veg":
      return <FaFireAlt className="text-red-500" />;
    case "Drink":
      return <FaWineGlassAlt className="text-blue-500" />;
    case "Dessert":
      return <FaIceCream className="text-purple-500" />;
    default:
      return <FaHamburger className="text-gray-500" />;
  }
};

// Main Component
const ChiefDashboard = () => {
  // State Management
  const [state, setState] = useState({
    orders: [],
    foods: [],
    loading: false,
    authenticated: false,
    activeTab: "orders",
    searchTerm: "",
    newFood: {
      name: "",
      price: "",
      quantityAvailable: "",
      offer: "",
      image: "",
      description: "",
      type: "",
      category: "",
    },
  });

  // Derived State
  const filteredOrders = state.orders.filter((order) =>
    order.items.some(
      (item) =>
        item.foodId?.name
          ?.toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        order.tableId.toString().includes(state.searchTerm)
    )
  );

  // Authentication Handler
  const handleLogin = async (password) => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const { data } = await axiosInstance.post("/auth/login", { password });

      if (data.success) {
        localStorage.setItem("chefToken", data.token);
        setState((prev) => ({ ...prev, authenticated: true, loading: false }));
        toast.success("Authentication successful!");
      }
    } catch (error) {
      toast.error(
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-red-500" />
          <span>Invalid credentials. Please try again.</span>
        </div>
      );
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Data Fetching
  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const token = localStorage.getItem("chefToken");

      const [ordersRes, foodsRes] = await Promise.all([
        axiosInstance.get("/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axiosInstance.get("/foods"),
      ]);

      setState((prev) => ({
        ...prev,
        orders: ordersRes.data,
        foods: foodsRes.data,
        loading: false,
      }));
    } catch (error) {
      toast.error("Failed to fetch data");
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Order Status Update
  const updateOrderStatus = async (orderId, currentStatus, tableId) => {
    const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(currentStatus) + 1];
    if (!nextStatus) return;

    try {
      const token = localStorage.getItem("chefToken");
      await axiosInstance.patch(
        `/orders/${orderId}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (nextStatus === ORDER_STATUS.READY) {
        notifyTable(tableId);
        await axiosInstance.delete(`/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Order completed and removed!");
      } else {
        toast.success(`Order marked as ${nextStatus}`);
      }

      fetchData();
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  // Food Management
  const handleAddFood = async () => {
    const { name, price, quantityAvailable, image, description, type } =
      state.newFood;
    if (
      !name ||
      !price ||
      !quantityAvailable ||
      !image ||
      !description ||
      !type
    ) {
      return toast.error("Please fill all required fields");
    }

    try {
      const token = localStorage.getItem("chefToken");
      await axiosInstance.post("/foods", state.newFood, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Menu item added successfully!");
      setState((prev) => ({
        ...prev,
        newFood: {
          name: "",
          price: "",
          quantityAvailable: "",
          offer: "",
          image: "",
          description: "",
          type: "",
          category: "",
        },
      }));
      fetchData();
    } catch (error) {
      toast.error("Failed to add menu item");
    }
  };

  const handleDeleteFood = async (foodId) => {
    try {
      await axiosInstance.delete(`/foods/${foodId}`);
      toast.success("Menu item deleted!");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete menu item");
    }
  };

  // Helper Functions
  const notifyTable = (tableId) => {
    toast.success(
      <div className="flex items-center gap-2">
        <FaFireAlt className="text-orange-500" />
        <span>Order for Table {tableId} is ready!</span>
      </div>
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      newFood: {
        ...prev.newFood,
        [name]: value,
      },
    }));
  };

  // Effects
  useEffect(() => {
    const token = localStorage.getItem("chefToken");
    if (token) {
      setState((prev) => ({ ...prev, authenticated: true }));
      fetchData();
      const interval = setInterval(fetchData, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [fetchData]);

  // Authentication Gate
  if (!state.authenticated) {
    return <AuthScreen onLogin={handleLogin} loading={state.loading} />;
  }

  // Main Render
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Navigation */}
      <DashboardHeader
        activeTab={state.activeTab}
        onTabChange={(tab) => setState((prev) => ({ ...prev, activeTab: tab }))}
        onLogout={() => {
          localStorage.removeItem("chefToken");
          setState((prev) => ({ ...prev, authenticated: false }));
        }}
      />

      <main className="container mx-auto px-4 py-6">
        {state.activeTab === "orders" ? (
          <OrdersSection
            orders={filteredOrders}
            loading={state.loading}
            searchTerm={state.searchTerm}
            onSearchChange={(term) =>
              setState((prev) => ({ ...prev, searchTerm: term }))
            }
            onStatusUpdate={updateOrderStatus}
          />
        ) : (
          <MenuManagementSection
            foods={state.foods}
            newFood={state.newFood}
            onInputChange={handleInputChange}
            onAddFood={handleAddFood}
            onDeleteFood={handleDeleteFood}
          />
        )}
      </main>
    </div>
  );
};

// Sub-Components
const AuthScreen = ({ onLogin, loading }) => {
  const [password, setPassword] = useState("");

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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onLogin(password)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
        />

        <button
          onClick={() => onLogin(password)}
          disabled={loading}
          className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <FiLoader className="animate-spin" />
          ) : (
            <>
              <FiLock />
              Unlock Dashboard
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const DashboardHeader = ({ activeTab, onTabChange, onLogout }) => (
  <header className="bg-white shadow-sm">
    <div className="container mx-auto px-4 py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FaUtensils className="text-orange-500" />
              Chef Dashboard
            </h1>
            <p className="text-gray-500">
              {dayjs().format("dddd, MMMM D, YYYY")}
            </p>
          </div>

          <button
            onClick={onLogout}
            className="md:hidden text-gray-500 hover:text-orange-500"
            aria-label="Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => onTabChange("orders")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "orders"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => onTabChange("menu")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "menu"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Menu
            </button>
          </div>

          <button
            onClick={onLogout}
            className="hidden md:flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <FiLogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  </header>
);

const OrdersSection = ({
  orders,
  loading,
  searchTerm,
  onSearchChange,
  onStatusUpdate,
}) => (
  <section>
    <div className="mb-6 bg-white p-4 rounded-xl shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search orders by table or item..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
          />
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

    {loading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    ) : orders.length === 0 ? (
      <EmptyState
        icon={<FiClock className="text-orange-500 text-2xl" />}
        title="No active orders"
        description="New orders will appear here automatically"
      />
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
            >
              <OrderCard order={order} onStatusUpdate={onStatusUpdate} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )}
  </section>
);

const OrderCard = ({ order, onStatusUpdate }) => (
  <>
    <div className="p-4 border-b border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-gray-700">Table #{order.tableId}</span>
        <span
          className={`text-xs font-bold uppercase px-2 py-1 rounded-full flex items-center gap-1 ${
            order.status === ORDER_STATUS.PENDING
              ? "bg-yellow-100 text-yellow-800"
              : order.status === ORDER_STATUS.PREPARING
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {STATUS_ICONS[order.status]}
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
            (sum, item) => sum + (item.foodId?.price || 0) * item.quantity,
            0
          )}
        </span>
        {order.status !== ORDER_STATUS.READY && (
          <button
            onClick={() =>
              onStatusUpdate(order._id, order.status, order.tableId)
            }
            className={`px-3 py-1.5 text-sm font-medium rounded-full flex items-center gap-1 transition ${
              order.status === ORDER_STATUS.PENDING
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {order.status === ORDER_STATUS.PENDING ? (
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
  </>
);

const MenuManagementSection = ({
  foods,
  newFood,
  onInputChange,
  onAddFood,
  onDeleteFood,
}) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <FiPlus className="text-orange-500" />
        Add New Menu Item
      </h2>

      <FoodForm food={newFood} onChange={onInputChange} onSubmit={onAddFood} />
    </div>

    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FaUtensils className="text-orange-500" />
          Current Menu
          <span className="text-sm font-normal bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
            {foods.length} items
          </span>
        </h2>
      </div>

      {foods.length === 0 ? (
        <EmptyState
          icon={<FaUtensils className="text-orange-500 text-2xl" />}
          title="No menu items"
          description="Add new items to display them here"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {foods.map((food) => (
              <motion.div
                key={food._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition"
              >
                <FoodCard food={food} onDelete={onDeleteFood} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  </div>
);

const FoodForm = ({ food, onChange, onSubmit }) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <FormField
          label="Food Name *"
          name="name"
          value={food.name}
          onChange={onChange}
          placeholder="e.g., Margherita Pizza"
        />

        <FormField
          label="Description *"
          name="description"
          value={food.description}
          onChange={onChange}
          placeholder="Describe the food item..."
          as="textarea"
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <FormField
              label="Price *"
              name="price"
              type="number"
              value={food.price}
              onChange={onChange}
              placeholder="0.00"
              prefix="₹"
            />
          </div>

          <div>
            <FormField
              label="Quantity *"
              name="quantityAvailable"
              type="number"
              value={food.quantityAvailable}
              onChange={onChange}
              placeholder="Available quantity"
            />
          </div>
        </div>
      </div>

      <div>
        <FormField
          label="Category *"
          name="category"
          value={food.category}
          onChange={onChange}
          as="select"
          options={FOOD_CATEGORIES}
        />

        <FormField
          label="Type *"
          name="type"
          value={food.type}
          onChange={onChange}
          as="select"
          options={FOOD_TYPES}
        />

        <FormField
          label="Special Offer (optional)"
          name="offer"
          value={food.offer}
          onChange={onChange}
          placeholder="e.g., 10% off, Combo Deal"
        />

        <FormField
          label="Image URL *"
          name="image"
          value={food.image}
          onChange={onChange}
          placeholder="https://example.com/image.jpg"
        />

        {food.image && (
          <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={food.image}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>

    <button
      type="submit"
      className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
    >
      <FiPlus />
      Add to Menu
    </button>
  </form>
);

const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  as = "input",
  options = [],
  prefix,
  ...props
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>

    {as === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
        {...props}
      >
        <option value="">Select {name}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    ) : as === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
        {...props}
      />
    ) : (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-2 text-gray-500">{prefix}</span>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${
            prefix ? "pl-8" : "pl-4"
          } pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition`}
          {...props}
        />
      </div>
    )}
  </div>
);

const FoodCard = ({ food, onDelete }) => (
  <>
    <div className="h-40 bg-gray-100 overflow-hidden relative">
      <img
        src={food.image || "/food-placeholder.png"}
        alt={food.name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {food.offer && (
        <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          {food.offer}
        </div>
      )}
    </div>

    <div className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-800 line-clamp-1">
          {food.name}
        </h3>
        <button
          onClick={() => onDelete(food._id)}
          className="text-gray-500 hover:text-red-500 transition-colors"
          aria-label="Delete item"
        >
          <FiTrash2 size={18} />
        </button>
      </div>

      <p className="text-gray-500 text-sm mb-3 line-clamp-2">
        {food.description || "No description available"}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          {getTypeIcon(food.type)}
          <span>{food.type}</span>
        </div>
        <div className="text-right font-medium text-orange-600">
          ₹{food.price}
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <FiTag />
          <span>{food.category || "Uncategorized"}</span>
        </div>
        <div className="text-right">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              food.quantityAvailable > 0
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {food.quantityAvailable > 0
              ? `${food.quantityAvailable} available`
              : "Out of stock"}
          </span>
        </div>
      </div>
    </div>
  </>
);

const EmptyState = ({ icon, title, description }) => (
  <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
    <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-gray-700 mb-1">{title}</h3>
    <p className="text-gray-500">{description}</p>
  </div>
);

export default ChiefDashboard;
