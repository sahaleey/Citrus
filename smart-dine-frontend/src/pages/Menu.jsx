// src/pages/Menu.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import axios from "axios";
import { getGuestId, setTableId as saveTableId } from "../utils/guest";
import OrderHistoryDrawer from "../components/OrderHistoryDrawer";

import FeaturedSlider from "../components/FeaturedSlider";
import MenuItemCard from "../components/MenuItemCard";
import Cart from "../components/Cart";
import Spinner from "../components/Spinner";
import FoodDetailModal from "../components/FoodDetailModal";
import OrderHistory from "../components/OrderHistory";
import BillModal from "../components/BillModel";
import { Search, AlertTriangle, XCircle, ShoppingCart, X } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const api = axios.create({ baseURL: API_BASE });

const Menu = ({ cart = [], addToCart, removeFromCart, clearCart }) => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableId, setTableId] = useState("");
  const [guestId, setGuestId] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const socketRef = useRef(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const isSubmitting = useRef(false);

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

  const fetchFoods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/foods");
      const foodsArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : res.data?.foods ?? [];
      if (!Array.isArray(foodsArray)) throw new Error("Invalid menu format.");
      setFoods(foodsArray);

      // build unique category list
      const cats = [
        "All",
        ...new Set(foodsArray.map((f) => f.category).filter(Boolean)),
      ];
      setCategories(cats);
    } catch (err) {
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

  useEffect(() => {
    if (!tableId || !guestId) return;
    if (!socketRef.current)
      socketRef.current = io(SOCKET_URL, { autoConnect: true });
    const socket = socketRef.current;
    socket.emit("joinTable", tableId);
    const onOrderStatusUpdate = (updatedOrder) => {
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
    return () => socket.off("orderStatusUpdate", onOrderStatusUpdate);
  }, [tableId, guestId]);

  const handleAddToCart = (food) => {
    const id = food._id || food.id;
    if (!id) return toast.error("Cannot add item — invalid data.");
    if (typeof addToCart === "function") {
      addToCart({
        foodId: id,
        name: food.name,
        price: Number(food.price) || 0,
        quantity: 1,
      });
    }
    toast.success(`${food.name} added to cart!`, { icon: "🛒" });
  };

  const filteredFoods = useMemo(() => {
    const search = (searchTerm || "").trim().toLowerCase();
    return foods.filter((f) => {
      const matchesCategory =
        selectedCategory === "All" ||
        (f.category && f.category === selectedCategory);
      const matchesSearch =
        !search || (f.name && f.name.toLowerCase().includes(search));
      return matchesCategory && matchesSearch;
    });
  }, [foods, selectedCategory, searchTerm]);

  const handlePlaceOrderRequest = async () => {
    if (!tableId || !guestId || !cart.length) {
      toast.error("Missing required order info.", { icon: "🚫" });
      return;
    }
    if (isSubmitting.current) return;
    const preparedItems = cart
      .map((it) => ({
        food: it.foodId || it._id || it.id,
        name: it.name,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
      }))
      .filter((i) => i.food);
    if (!preparedItems.length) {
      toast.error("Invalid cart items. Try re-adding.");
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
      if (res.data?.success) {
        toast.success("Order placed successfully! 🍽️");
        if (typeof clearCart === "function") clearCart();
        setIsCartOpen(false);
      } else toast.error(res.data?.message || "Order failed");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Order failed");
    } finally {
      isSubmitting.current = false;
      setIsPlacingOrder(false);
    }
  };

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

            {/* search bar */}
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

            {/* category tabs */}
            <div className="flex overflow-x-auto gap-3 mb-6 pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-[#3a9c6c] text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* menu list */}
            <section>
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Spinner text="Loading menu..." />
                </div>
              ) : error ? (
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
              ) : (
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

          {/* desktop cart sidebar (unchanged) */}
          <div className="hidden lg:block lg:col-span-1">
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

      {/* floating mobile cart and drawer (unchanged) */}
      {Array.isArray(cart) && cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-[9999] bg-[var(--primary-color)] text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {cart.length}
          </span>
        </button>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[9998] flex items-end lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsCartOpen(false)}
          />
          <div
            className="relative w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-500 ease-out animate-slide-up border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#3a9c6c] rounded-xl">
                  <ShoppingCart size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                  <p className="text-sm text-gray-500">
                    {cart?.length || 0} items
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200 group"
              >
                <X
                  size={20}
                  className="text-gray-500 group-hover:text-gray-700"
                />
              </button>
            </div>
            <div
              className="p-6 overflow-y-auto modern-scrollbar"
              style={{ maxHeight: "calc(85vh - 140px)" }}
            >
              <Cart
                cart={cart}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                tableId={tableId}
                guestId={guestId}
                onRequestPlaceOrder={handlePlaceOrderRequest}
                isPlacingOrder={isPlacingOrder}
              />
            </div>
          </div>
        </div>
      )}

      <OrderHistoryDrawer
        guestId={guestId}
        tableId={tableId}
        onOrdersCleared={() => setIsCartOpen(false)}
      />
    </>
  );
};

export default Menu;
