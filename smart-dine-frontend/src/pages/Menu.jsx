// src/pages/Menu.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import axios from "axios";
import { getGuestId, setTableId as saveTableId } from "../utils/guest";

import FeaturedSlider from "../components/FeaturedSlider";
import MenuItemCard from "../components/MenuItemCard";
import Cart from "../components/Cart";
import Spinner from "../components/Spinner";
import FoodDetailModal from "../components/FoodDetailModal";
import OrderHistory from "../components/OrderHistory";
import BillModal from "../components/BillModel";
import { Search, AlertTriangle, XCircle } from "lucide-react";

// API & Socket config
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const api = axios.create({ baseURL: API_BASE });

const Menu = ({ cart, addToCart, removeFromCart, clearCart }) => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [typeFilter, setTypeFilter] = useState("All"); // Veg / Non-Veg / All
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableId, setTableId] = useState("");
  const [guestId, setGuestId] = useState("");
  const socketRef = useRef(null);

  // Order placement UI state + double-submit guard
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const isSubmitting = useRef(false);

  // --- Table + Guest setup ---
  useEffect(() => {
    const table = searchParams.get("table");
    if (!table) {
      toast.error("No table ID found! Please scan a valid QR code.", {
        icon: "🚫",
        duration: 5000,
      });
      setTableId("");
      saveTableId("");
    } else {
      setTableId(table);
      saveTableId(table);
    }
    setGuestId(getGuestId());
  }, [searchParams]);

  // --- Fetch menu ---
  const fetchFoods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/foods");
      // accommodate different shapes: {data: [...]} or [...]
      const foodsArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : res.data?.foods ?? [];

      if (!Array.isArray(foodsArray)) throw new Error("Invalid menu format.");
      setFoods(foodsArray);

      // derive categories (use original casing)
      const cats = [
        "All",
        ...new Set(foodsArray.map((f) => f.type).filter(Boolean)),
      ];
      setCategories(cats);
    } catch (err) {
      console.error("Failed to fetch menu:", err);
      const msg =
        err.response?.data?.message || err.message || "Could not load menu.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  // --- Socket setup for live notifications ---
  useEffect(() => {
    if (!tableId || !guestId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, { autoConnect: true });
    } else if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
    const socket = socketRef.current;

    socket.emit("joinTable", tableId);
    console.log(`[socket] joinTable ${tableId}`);

    const onOrderStatusUpdate = (updatedOrder) => {
      console.log("[socket] orderStatusUpdate", updatedOrder);
      if (
        updatedOrder.guestId === guestId &&
        updatedOrder.tableId === tableId
      ) {
        if (updatedOrder.status === "Ready") {
          toast.success("Your order is ready!", { icon: "📦", duration: 5000 });
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
      }
    };

    socket.on("orderStatusUpdate", onOrderStatusUpdate);

    return () => {
      socket.off("orderStatusUpdate", onOrderStatusUpdate);
      // we do not forcibly disconnect here — keep connection for other tables/apps unless explicitly needed
      console.log(`[socket] leaveTable ${tableId}`);
    };
  }, [tableId, guestId]);

  // --- Add to cart wrapper (use prop) ---
  const handleAddToCart = (food) => {
    // Resolve id
    const id = food._id || food.id;
    if (!id) {
      console.error("food missing id", food);
      toast.error("Cannot add item — invalid data.");
      return;
    }
    // ensure we pass a normalized item into addToCart
    addToCart({
      foodId: id,
      name: food.name,
      price: Number(food.price) || 0,
      quantity: 1,
    });
    toast.success(`${food.name} added to cart!`, { icon: "🛒" });
  };

  // --- Build filters and filteredFoods ---
  const filteredFoods = useMemo(() => {
    const search = (searchTerm || "").trim().toLowerCase();
    return foods.filter((f) => {
      const matchesCategory =
        selectedCategory === "All" || (f.type && f.type === selectedCategory);
      const matchesType =
        typeFilter === "All" || (f.category && f.category === typeFilter);
      const matchesSearch =
        !search || (f.name && f.name.toLowerCase().includes(search));
      return matchesCategory && matchesType && matchesSearch;
    });
  }, [foods, selectedCategory, typeFilter, searchTerm]);

  // --- Place order (centralized) ---
  const handlePlaceOrderRequest = async () => {
    if (!tableId) {
      toast.error("Invalid table ID. Scan QR.", { icon: "🚫" });
      return;
    }
    if (!guestId) {
      toast.error("Guest ID missing.", { icon: "🚫" });
      return;
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      toast.error("Cart is empty!", { icon: "🛒" });
      return;
    }

    if (isSubmitting.current) {
      console.log("Submission already in progress, ignoring duplicate click.");
      return;
    }

    // Ensure every cart item has food id
    const preparedItems = cart
      .map((it) => {
        const id = it.foodId || it._id || it.id;
        if (!id) return null;
        return {
          food: id,
          name: it.name,
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
        };
      })
      .filter(Boolean);

    if (preparedItems.length !== cart.length) {
      toast.error("One or more cart items are invalid. Please re-add items.");
      console.error("Invalid cart items (missing id):", cart);
      return;
    }

    const payload = {
      tableId,
      guestId,
      totalPrice: preparedItems.reduce((s, i) => s + i.price * i.quantity, 0),
      items: preparedItems,
    };

    isSubmitting.current = true;
    setIsPlacingOrder(true);

    try {
      const res = await api.post("/orders", payload);
      const data = res.data;

      if (data && data.success) {
        toast.success("Order placed successfully! 🍽️");
        clearCart();
      } else {
        const msg = data?.message || "Failed to place order.";
        toast.error(msg);
        console.error("Order failed response:", data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Order failed";
      toast.error(msg);
      console.error("Order error:", err.response?.data ?? err);
    } finally {
      isSubmitting.current = false;
      setIsPlacingOrder(false);
    }
  };

  // --- Render helpers ---
  const CategoryTabs = () => (
    <div className="mb-4 flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setSelectedCategory(cat)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all capitalize ${
            selectedCategory === cat
              ? "bg-[var(--primary-color)] text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {cat}
        </button>
      ))}
      {/* type filter */}
      <div className="ml-2 flex items-center gap-2">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value="All">All Types</option>
          <option value="Veg">Veg</option>
          <option value="Non-Veg">Non-Veg</option>
          <option value="Vegan">Vegan</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      <FoodDetailModal
        item={selectedFood}
        onClose={() => setSelectedFood(null)}
        onAddToCart={() => selectedFood && handleAddToCart(selectedFood)}
      />

      {selectedBill && (
        <BillModal order={selectedBill} onClose={() => setSelectedBill(null)} />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {!isLoading && !error && foods.length > 0 && (
              <FeaturedSlider items={foods} onItemClick={setSelectedFood} />
            )}

            <div className="my-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for a dish..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)]"
                />
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <CategoryTabs />

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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredFoods.length > 0 ? (
                    filteredFoods.map((food) => (
                      <MenuItemCard
                        key={food._id || food.id}
                        item={food}
                        onAddToCart={() => handleAddToCart(food)}
                        onShowDetails={setSelectedFood}
                      />
                    ))
                  ) : (
                    <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
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

          <div className="lg:col-span-1">
            <div className="sticky top-24 flex flex-col gap-6">
              <Cart
                cart={cart}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                tableId={tableId}
                guestId={guestId}
                onRequestPlaceOrder={handlePlaceOrderRequest}
                isPlacingOrder={isPlacingOrder}
              />

              {guestId && tableId && (
                <OrderHistory guestId={guestId} tableId={tableId} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Menu;
