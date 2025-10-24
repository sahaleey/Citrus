// src/pages/Menu.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import { getGuestId } from "../utils/guest";

import FeaturedSlider from "../components/FeaturedSlider";
import MenuItemCard from "../components/MenuItemCard";
import Cart from "../components/Cart";
import Spinner from "../components/Spinner";
import FoodDetailModal from "../components/FoodDetailModal";
import OrderHistory from "../components/OrderHistory";
import BillModal from "../components/BillModel"; // PDF bill modal
import { Search, AlertTriangle, XCircle } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "https://citrus-c209.onrender.com/api";
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "https://citrus-c209.onrender.com";
const socket = io(SOCKET_URL, { autoConnect: true });

const Menu = ({ addToCart, cart, removeFromCart, clearCart }) => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null); // BillModal
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableId, setTableId] = useState("");
  const [guestId, setGuestId] = useState("");

  // --- Table + Guest setup ---
  useEffect(() => {
    const table = searchParams.get("table");
    if (!table) {
      toast.error("No table ID found! Please scan a valid QR code.", {
        icon: "🚫",
        duration: 5000,
      });
    }
    setTableId(table || "");
    setGuestId(getGuestId());
  }, [searchParams]);

  // --- Fetch menu ---
  const fetchFoods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/foods`);
      if (!res.ok)
        throw new Error("Failed to fetch menu. Server might be down.");

      const data = await res.json();
      const foodsArray = data.data || data.foods || data || [];
      if (!Array.isArray(foodsArray)) throw new Error("Invalid menu format.");

      setFoods(foodsArray);

      const validCategories = foodsArray
        .map((item) => item.type?.trim().toLowerCase())
        .filter(Boolean);
      setCategories(["All", ...new Set(validCategories)]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  // --- Fetch active orders for this guest ---
  const fetchActiveOrders = async () => {
    if (!guestId || !tableId) return; // make sure both exist
    try {
      const res = await fetch(
        `${API_URL}/orders/my-orders?guestId=${guestId}&tableId=${tableId}`
      );
      if (!res.ok) throw new Error("Failed to fetch active orders");
      const data = await res.json();
      setActiveOrders(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, [guestId, tableId, cart]);

  // --- Socket.io setup for live order updates ---
  useEffect(() => {
    if (!tableId) return;

    socket.emit("joinTable", tableId);

    const handleOrderStatus = (updatedOrder) => {
      if (updatedOrder.tableId === tableId) {
        setActiveOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );

        if (updatedOrder.status === "Ready") {
          toast.success(`Order for table ${tableId} is ready!`, {
            icon: "📦",
            duration: 5000,
          });
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
      }
    };

    socket.on("orderStatusUpdate", handleOrderStatus);

    return () => {
      socket.off("orderStatusUpdate", handleOrderStatus);
    };
  }, [tableId]);

  // --- Cart actions ---
  const handleAddToCart = (food) => {
    addToCart(food);
    toast.success(`${food.name} added to cart!`, { icon: "🛒" });
  };

  const handleOrderPlaced = async (cartItems) => {
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          guestId,
          items: cartItems,
          totalPrice: cartItems.reduce(
            (sum, item) =>
              sum + (item.price || item.food?.price || 0) * item.quantity,
            0
          ),
        }),
      });
      const data = await res.json();
      if (data.success) {
        clearCart();
        setActiveOrders((prev) => [...prev, data.data]);
        toast.success("Order placed successfully! 🍽️");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Try again.");
    }
  };

  const filteredFoods = Array.isArray(foods)
    ? foods.filter((food) => {
        const matchesCategory =
          selectedCategory === "All" ||
          (food.type &&
            food.type.toLowerCase() === selectedCategory.toLowerCase());
        const matchesSearch = food.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
    : [];

  return (
    <>
      <FoodDetailModal
        item={selectedFood}
        onClose={() => setSelectedFood(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Bill Modal */}
      {selectedBill && (
        <BillModal order={selectedBill} onClose={() => setSelectedBill(null)} />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Menu Section */}
        <div className="lg:col-span-2">
          {!isLoading && !error && (
            <FeaturedSlider items={foods} onItemClick={setSelectedFood} />
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a dish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-black focus:ring-1 focus:ring-black"
              />
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Food Grid */}
          <section>
            {isLoading && (
              <div className="flex h-64 items-center justify-center">
                <Spinner text="Loading menu..." />
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-8 text-center text-red-700">
                <AlertTriangle size={32} className="mb-2" />
                <h3 className="text-lg font-semibold">Failed to load menu</h3>
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchFoods}
                  className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            )}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredFoods.length > 0 ? (
                  filteredFoods.map((food) => (
                    <MenuItemCard
                      key={food._id}
                      item={food}
                      onAddToCart={handleAddToCart}
                      onShowDetails={setSelectedFood}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500 md:col-span-2">
                    <XCircle size={32} className="mb-2" />
                    <h3 className="text-lg font-semibold">No Items Found</h3>
                    <p className="text-sm">
                      {searchTerm
                        ? `No results for "${searchTerm}" in ${selectedCategory}.`
                        : `No items in the ${selectedCategory} category.`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Cart + Orders Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-6">
            <Cart
              cart={cart}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              tableId={tableId}
              guestId={guestId}
              foods={foods}
              onOrderPlaced={handleOrderPlaced}
            />

            <OrderHistory
              guestId={guestId}
              tableId={tableId}
              cart={cart}
              activeOrders={activeOrders}
              onOrdersCleared={() => setActiveOrders([])}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;
