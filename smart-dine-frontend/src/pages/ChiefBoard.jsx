import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../api/axiosConfig";
import { toast, Toaster } from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import jsPDF from "jspdf";
import { io } from "socket.io-client";
import {
  LoaderCircle,
  Clock,
  CheckCircle,
  ChefHat,
  Search,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  Lock,
  LogOut,
  Moon,
  Sun,
  HardDrive,
  Eye,
  Salad,
  Flame,
  Cake,
  Wine, // --- UPDATED --- (Was 'GlassOfWine')
} from "lucide-react";

// --- Socket.io setup ---
// We use a relative path, which will work with our proxy
const socket = io("https://citrus-c209.onrender.com", { path: "/socket.io" });

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

// --- Constants ---
const ORDER_STATUS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

const STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
];

// --- Helper: Get Status Styles (Tailwind) ---
const getStatusStyles = (status) => {
  switch (status) {
    case ORDER_STATUS.PENDING:
      return "bg-yellow-100 text-yellow-800";
    case ORDER_STATUS.PREPARING:
      return "bg-blue-100 text-blue-800";
    case ORDER_STATUS.READY:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// --- Helper: Get Status Icon ---
const StatusIcon = ({ status }) => {
  switch (status) {
    case ORDER_STATUS.PENDING:
      return <Clock size={16} className="text-yellow-600" />;
    case ORDER_STATUS.PREPARING:
      return <LoaderCircle size={16} className="animate-spin text-blue-600" />;
    case ORDER_STATUS.READY:
      return <CheckCircle size={16} className="text-green-600" />;
    default:
      return <ChefHat size={16} className="text-gray-600" />;
  }
};

// --- Helper: Get Food Type Icon ---
const FoodTypeIcon = ({ type, category }) => {
  if (category === "Veg") return <Salad size={16} className="text-green-600" />;
  if (category === "Non-Veg")
    return <Flame size={16} className="text-red-600" />;

  switch (type) {
    case "Starters":
      return <Salad size={16} className="text-green-600" />;
    case "Mains":
      return <Flame size={16} className="text-red-600" />;
    case "Desserts":
      return <Cake size={16} className="text-pink-600" />;
    case "Drinks":
      return <Wine size={16} className="text-purple-600" />; // --- UPDATED --- (Was 'GlassOfWine')
    default:
      return <ChefHat size={16} className="text-gray-500" />;
  }
};

// ###############################
// ### MAIN DASHBOARD COMPONENT ###
// ###############################
const ChiefDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");

  // --- API Call Function ---
  // Use a relative path '/api' to leverage the Vite proxy
  const api = axios.create({
    baseURL: "/api",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("chefToken")}`,
    },
  });

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the 'success' and 'data' structure from our new backend
      const [ordersRes, foodsRes] = await Promise.all([
        api.get("/orders"),
        api.get("/foods"), // Foods are public, no auth needed
      ]);

      // --- THE BUG FIX (Line 103) ---
      // We set state to `ordersRes.data.data` (the list)
      // not `ordersRes.data` (the report object)
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      } else {
        toast.error("Could not load orders.");
      }

      // --- FIX FOR FOODS ---
      // The food controller sends the array directly
      console.log("Foods response:", foodsRes.data);

      if (foodsRes.data) {
        setFoods(foodsRes.data);
      } else {
        toast.error("Could not load menu.");
      }
    } catch (error) {
      const errorMsg =
        error.response?.status === 401
          ? "Session expired. Please log in again."
          : "Failed to fetch data.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed api from dependencies, it's stable

  // --- Socket.io Event Handlers ---
  useEffect(() => {
    // Check auth status on load
    const token = localStorage.getItem("chefToken");
    if (token) {
      setAuthenticated(true);
      fetchData(); // Fetch initial data
    } else {
      setIsLoading(false);
    }

    // --- Socket Listeners ---
    function onNewOrder(newOrder) {
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
      toast.success(`New order for Table #${newOrder.tableId}!`, {
        icon: "🔔",
        style: {
          background: "var(--primary-color-dark)",
          color: "var(--text-on-primary)",
        },
      });
    }

    function onOrderUpdated(updatedOrder) {
      // --- UPDATED LOGIC ---
      // If the order is marked as "Served" or "Cancelled", remove it from the Chef's live board.
      if (
        updatedOrder.status === ORDER_STATUS.SERVED ||
        updatedOrder.status === ORDER_STATUS.CANCELLED
      ) {
        setOrders((prevOrders) =>
          prevOrders.filter((o) => o._id !== updatedOrder._id)
        );
      } else {
        // Otherwise, just update its status (e.g., Pending -> Preparing)
        setOrders((prevOrders) =>
          prevOrders.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      }
    }

    function onOrderDeleted({ id }) {
      setOrders((prevOrders) => prevOrders.filter((o) => o._id !== id));
    }

    socket.on("newOrder", onNewOrder);
    socket.on("orderUpdated", onOrderUpdated);
    socket.on("orderDeleted", onOrderDeleted);

    return () => {
      socket.off("newOrder", onNewOrder);
      socket.off("orderUpdated", onOrderUpdated);
      socket.off("orderDeleted", onOrderDeleted);
    };
  }, [authenticated, fetchData]);

  const handleStatusUpdate = async (order) => {
    const currentStatus = order.status;
    const nextStatusIndex = STATUS_FLOW.indexOf(currentStatus) + 1;

    // If it's the last step ("Ready"), the next action is different
    if (nextStatusIndex >= STATUS_FLOW.length) {
      // This is the "Mark as Served" step
      handleServeOrder(order);
      return;
    }

    const nextStatus = STATUS_FLOW[nextStatusIndex];

    try {
      // Optimistic UI Update (feels faster)
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === order._id ? { ...o, status: nextStatus } : o
        )
      );

      await api.patch(`/orders/${order._id}/status`, {
        status: nextStatus,
      });
      toast.success(
        `Order for Table #${order.tableId} marked as ${nextStatus}.`
      );
      // No need to call fetchData(), socket will handle the update
    } catch (error) {
      toast.error("Failed to update status.");
      // Revert optimistic update
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === order._id ? { ...o, status: currentStatus } : o
        )
      );
    }
  };
  useEffect(() => {
    if (activeTab === "menu") {
      fetchData(); // refresh orders + foods when switching to Menu
    }
  }, [activeTab, fetchData]);

  const handleServeOrder = async (order) => {
    // 2. Update status to "Served".
    // --- UPDATED LOGIC ---
    // We removed the optimistic UI update.
    // The socket listener 'onOrderUpdated' will now handle removing it from the list
    // once the server confirms the update. This is more reliable.
    try {
      await api.patch(`/orders/${order._id}/status`, {
        status: "Served",
      });
      toast.success(
        `Order for Table #${order.tableId} served and bill generated!`
      );
    } catch (error) {
      toast.error("Failed to mark as served.");
      // No need to revert UI, as we are no longer optimistic.
    }
  };

  // --- Memoized Derived State ---
  // This re-runs *only* when orders or searchTerm changes
  const filteredOrders = useMemo(() => {
    // This is safe because 'orders' is guaranteed to be an array []
    return orders.filter(
      (order) =>
        order.tableId.toString().includes(searchTerm) ||
        order.items.some((item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [orders, searchTerm]);

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-color)]">
      <Toaster position="top-right" />
      <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {activeTab === "orders" ? (
          <OrdersSection
            orders={filteredOrders}
            loading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onStatusUpdate={handleStatusUpdate}
            onGenerateBill={handleServeOrder}
          />
        ) : (
          <MenuManagementSection
            foods={foods}
            onDataRefresh={fetchData}
            api={api}
          />
        )}
      </main>
    </div>
  );
};

// ########################
// ### DASHBOARD HEADER ###
// ########################
const DashboardHeader = ({ activeTab, onTabChange }) => {
  return (
    <header className="sticky top-0  bg-[var(--surface-color)] shadow-sm -z-0">
      <div className="mx-auto max-w-7xl px-4 ">
        <div className="flex h-16 items-center justify-between ">
          {/* Logo and Title */}
          <div className="flex items-center gap-4 ">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary-color)]">
              <ChefHat className="text-[var(--text-on-primary)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text-color)]">
              Citrus Chef Panel
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex md:gap-2">
            <TabButton
              label="Live Orders"
              isActive={activeTab === "orders"}
              onClick={() => onTabChange("orders")}
            />
            <TabButton
              label="Menu Management"
              isActive={activeTab === "menu"}
              onClick={() => onTabChange("menu")}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex gap-2 border-t border-[var(--border-color)] p-2 md:hidden">
          <TabButton
            label="Live Orders"
            isActive={activeTab === "orders"}
            onClick={() => onTabChange("orders")}
            isMobile={true}
          />
          <TabButton
            label="Menu"
            isActive={activeTab === "menu"}
            onClick={() => onTabChange("menu")}
            isMobile={true}
          />
        </div>
      </div>
    </header>
  );
};

const TabButton = ({ label, isActive, onClick, isMobile = false }) => (
  <button
    onClick={onClick}
    className={`
      ${isMobile ? "w-full justify-center" : ""}
      relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all
      ${
        isActive
          ? "bg-[var(--primary-color)] text-[var(--text-on-primary)] shadow-md"
          : "text-[var(--text-color-secondary)] hover:bg-gray-100/50 hover:text-[var(--text-color)]"
      }
    `}
  >
    {label}
  </button>
);

// ####################
// ### ORDERS TAB ###
// ####################
const OrdersSection = ({
  orders,
  loading,
  searchTerm,
  onSearchChange,
  onStatusUpdate,
  onGenerateBill,
}) => (
  <section>
    <div className="relative mb-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search className="text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search by Table ID or Item Name..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] p-3 pl-12 text-base focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--primary-color-light)]/50"
      />
    </div>

    {loading && orders.length === 0 ? (
      <div className="flex justify-center p-12">
        <LoaderCircle
          size={40}
          className="animate-spin text-[var(--primary-color)]"
        />
      </div>
    ) : !loading && orders.length === 0 ? (
      <EmptyState
        icon={<CheckCircle size={48} />}
        title="All Orders Cleared!"
        description="New orders from customers will appear here."
      />
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div
              key={order._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex flex-col overflow-hidden rounded-xl bg-[var(--surface-color)] shadow-[var(--box-shadow)]"
            >
              <OrderCard
                order={order}
                onStatusUpdate={onStatusUpdate}
                onGenerateBill={onGenerateBill}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )}
  </section>
);

const OrderCard = ({ order, onStatusUpdate, onGenerateBill }) => {
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

  return (
    <>
      {/* Card Header */}
      <div className="border-b border-[var(--border-color)] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--text-color)]">
            Table #{order.tableId}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${getStatusStyles(
              order.status
            )}`}
          >
            <StatusIcon status={order.status} />
            {order.status}
          </span>
        </div>
        <p className="text-xs text-[var(--text-color-secondary)]">
          {dayjs(order.createdAt).fromNow()} ({order.items.length} items)
        </p>
      </div>

      {/* Card Body (Items) */}
      <div className="flex-1 space-y-3 p-4">
        {order.items.map((item) => (
          <div key={item.food} className="flex items-center gap-3">
            <span className="flex-shrink-0 rounded-full bg-[var(--primary-color)]/10 px-2 py-0.5 text-sm font-bold text-[var(--primary-color-dark)]">
              {item.quantity}x
            </span>
            <span className="flex-1 truncate font-medium">{item.name}</span>
            <span className="text-sm text-[var(--text-color-secondary)]">
              ₹{item.price * item.quantity}
            </span>
          </div>
        ))}
      </div>

      {/* Card Footer (Actions) */}
      <div className="border-t border-[var(--border-color)] bg-gray-50/50 p-4">
        <div className="mb-3 flex justify-between text-lg font-bold">
          <span className="text-[var(--text-color)]">Total:</span>
          <span className="text-[var(--primary-color-dark)]">
            {/* --- THE FIX --- */}
            {/* Use (order.totalPrice || 0) to provide a fallback in case totalPrice is missing on old orders */}
            ₹{(order.totalPrice || 0).toFixed(2)}
          </span>
        </div>

        {/* Action Button */}
        {order.status === ORDER_STATUS.READY ? (
          <button
            onClick={() => onGenerateBill(order)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-700 px-4 py-3 text-base font-semibold text-white transition-all hover:bg-zinc-800"
          >
            <FileText size={18} />
            Generate Bill & Serve
          </button>
        ) : (
          <button
            onClick={() => onStatusUpdate(order)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-4 py-3 text-base font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)]"
          >
            <StatusIcon status={nextStatus} />
            Mark as {nextStatus}
          </button>
        )}
      </div>
    </>
  );
};

// ####################
// ### MENU TAB ###
// ####################
const MenuManagementSection = ({ foods, onDataRefresh, api }) => {
  const [showForm, setShowForm] = useState(false);

  const handleDeleteFood = async (foodId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await api.delete(`/foods/${foodId}`);
        toast.success("Menu item deleted!");
        onDataRefresh(); // Refresh data
      } catch (error) {
        toast.error("Failed to delete menu item.");
      }
    }
  };

  return (
    <section className="space-y-6">
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-[var(--surface-color)] p-6 shadow-[var(--box-shadow)]">
              <h2 className="mb-6 text-xl font-bold text-[var(--text-color)]">
                Add New Menu Item
              </h2>
              <FoodForm
                api={api}
                onSuccess={() => {
                  setShowForm(false);
                  onDataRefresh();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl bg-[var(--surface-color)] p-6 shadow-[var(--box-shadow)]">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-xl font-bold text-[var(--text-color)]">
            Current Menu
            <span className="ml-3 rounded-full bg-[var(--primary-color)]/10 px-3 py-1 text-sm font-medium text-[var(--primary-color-dark)]">
              {foods.length} items
            </span>
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)]"
          >
            <Plus size={18} />
            {showForm ? "Cancel" : "Add New Item"}
          </button>
        </div>

        {foods.length === 0 ? (
          <EmptyState
            icon={<HardDrive size={48} />}
            title="Menu is Empty"
            description="Click 'Add New Item' to build your menu."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {foods.map((food) => (
              <FoodCard
                key={food._id}
                food={food}
                onDelete={handleDeleteFood}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const FoodForm = ({ api, onSuccess, food: initialFood }) => {
  const [food, setFood] = useState(
    initialFood || {
      name: "",
      price: "",
      description: "",
      image: "",
      type: "Mains",
      category: "Veg",
      quantityAvailable: 100,
      offer: "",
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFood((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!food.name || !food.price || !food.description || !food.image) {
      return toast.error("Please fill all required fields (*).");
    }

    setIsSubmitting(true);
    try {
      await api.post("/foods", food);
      toast.success("Menu item added successfully!");
      onSuccess(); // Call parent's success handler
    } catch (error) {
      toast.error("Failed to add menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          label="Food Name *"
          name="name"
          value={food.name}
          onChange={handleChange}
        />
        <FormField
          label="Image URL *"
          name="image"
          value={food.image}
          onChange={handleChange}
        />
      </div>
      <FormField
        label="Description *"
        name="description"
        as="textarea"
        rows={3}
        value={food.description}
        onChange={handleChange}
      />
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        <FormField
          label="Price (₹) *"
          name="price"
          type="number"
          value={food.price}
          onChange={handleChange}
        />
        <FormField
          label="Quantity *"
          name="quantityAvailable"
          type="number"
          value={food.quantityAvailable}
          onChange={handleChange}
        />
        <FormField
          label="Category *"
          name="category"
          as="select"
          value={food.category}
          onChange={handleChange}
        >
          <option value="Veg">Veg</option>
          <option value="Non-Veg">Non-Veg</option>
          <option value="Vegan">Vegan</option>
        </FormField>
        <FormField
          label="Type *"
          name="type"
          as="select"
          value={food.type}
          onChange={handleChange}
        >
          <option value="Starters">Starters</option>
          <option value="Mains">Mains</option>
          <option value="Desserts">Desserts</option>
          <option value="Drinks">Drinks</option>
          <option value="Specials">Specials</option>
        </FormField>
      </div>
      <FormField
        label="Special Offer (e.g., '10% Off')"
        name="offer"
        value={food.offer}
        onChange={handleChange}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-5 py-2.5 text-sm font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)] disabled:bg-gray-400"
        >
          {isSubmitting ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Plus size={18} />
          )}
          {isSubmitting ? "Saving..." : "Save to Menu"}
        </button>
      </div>
    </form>
  );
};

const FormField = ({ label, name, as = "input", children, ...props }) => {
  const InputComponent = as; // 'as' can be "input", "textarea", or "select"
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-sm font-medium text-[var(--text-color-secondary)]"
      >
        {label}
      </label>
      <InputComponent
        id={name}
        name={name}
        className="w-full rounded-md border border-[var(--border-color)] bg-transparent p-2.5 text-sm focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]"
        {...props}
      >
        {children}
      </InputComponent>
    </div>
  );
};

const FoodCard = ({ food, onDelete }) => (
  <div className="overflow-hidden rounded-lg border border-[var(--border-color)] shadow-sm transition-shadow hover:shadow-md">
    <div className="relative h-40 w-full">
      <img
        src={food.image}
        alt={food.name}
        className="h-full w-full object-cover"
        onError={(e) => {
          e.target.src =
            "https://placehold.co/600x400/eeeeee/cccccc?text=No+Image";
        }}
      />
      {food.offer && (
        <span className="absolute top-3 left-3 rounded-full bg-[var(--primary-color-dark)] px-3 py-1 text-xs font-bold text-white">
          {food.offer}
        </span>
      )}
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-[var(--text-color)]">
          {food.name}
        </h3>
        <span className="flex-shrink-0 text-lg font-bold text-[var(--primary-color)]">
          ₹{food.price}
        </span>
      </div>
      <p className="mt-1 mb-4 h-10 text-sm text-[var(--text-color-secondary)] line-clamp-2">
        {food.description}
      </p>
      <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4">
        <span className="flex items-center gap-2 text-sm text-[var(--text-color-secondary)]">
          <FoodTypeIcon type={food.type} category={food.category} />
          {food.category} / {food.type}
        </span>
        <button
          onClick={() => onDelete(food._id)}
          className="rounded-full p-2 text-[var(--text-color-secondary)] transition-colors hover:bg-red-100 hover:text-red-600"
          aria-label="Delete item"
          title="Delete Item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon, title, description }) => (
  <div className="my-16 flex flex-col items-center gap-4 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-[var(--primary-color)]">
      {React.cloneElement(icon, { size: 32, strokeWidth: 1.5 })}
    </div>
    <div>
      <h3 className="text-xl font-semibold text-[var(--text-color)]">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-color-secondary)]">
        {description}
      </p>
    </div>
  </div>
);

export default ChiefDashboard;
