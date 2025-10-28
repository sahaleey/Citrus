import React, { useState } from "react";
// --- 1. REMOVE BrowserRouter, it's in main.jsx now ---
import { Routes, Route, Navigate } from "react-router-dom";
import Menu from "./pages/Menu";
import ChiefBoard from "./pages/ChiefBoard";
import OwnerDashboard from "./pages/OwnerDashboard";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage"; // <-- 2. Import Login Page
import ProtectedRoute from "./components/ProtectedRoute"; // <-- 3. Import Bouncer

function App() {
  const [cart, setCart] = useState([]);

  // ... (All your cart functions: addToCart, removeFromCart, clearCart are PERFECT) ...
  // Function to add an item to the cart
  const addToCart = (item) => {
    setCart((prevCart) => {
      // ✅ FIXED: Use item.foodId (which Menu.jsx sends)
      const existingItem = prevCart.find((ci) => ci.foodId === item.foodId);

      if (existingItem) {
        // Increase quantity if item already in cart
        return prevCart.map((ci) =>
          ci.foodId === item.foodId ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }

      // Add new item to cart - just spread the item to preserve foodId
      return [...prevCart, { ...item }];
    });
  };

  // Function to remove an item from the cart
  const removeFromCart = (itemId) => {
    setCart((prevCart) => {
      // --- UPDATED: Check against foodId ---
      const existingItem = prevCart.find((ci) => ci.foodId === itemId);

      // If quantity is more than 1, just reduce quantity
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((ci) =>
          ci.foodId === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci
        );
      }
      // Otherwise, remove the item from the cart completely
      // --- UPDATED: Check against foodId ---
      return prevCart.filter((ci) => ci.foodId !== itemId);
    });
  };

  // Function to clear the entire cart (e.g., after placing order)
  const clearCart = () => {
    setCart([]);
  };
  // -------------------------

  return (
    // --- 4. REMOVE <BrowserRouter> wrapper ---
    <div className="min-h-screen bg-[var(--background-color)] font-sans text-[var(--text-color)]">
      <Header />
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Routes>
          {/* --- 5. Public Routes --- */}
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/menu"
            element={
              <Menu
                addToCart={addToCart}
                cart={cart}
                removeFromCart={removeFromCart}
                clearCart={clearCart} // <-- Pass clearCart down
              />
            }
          />
          <Route path="/" element={<Navigate to="/menu?table=default-1" />} />

          {/* --- 6. Protected Routes (The "Bouncer" is at work) --- */}

          {/* Chefs and Admins can see the Chef Board */}
          <Route
            path="/chef-dashboard"
            element={
              <ProtectedRoute allowedRoles={["chef", "admin"]}>
                <ChiefBoard />
              </ProtectedRoute>
            }
          />

          {/* ONLY Admins can see the Owner Dashboard */}
          <Route
            path="/owner-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
    // --- 7. REMOVE </BrowserRouter> wrapper ---
  );
}

export default App;
