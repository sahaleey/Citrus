import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import FeaturedSlider from "../components/FeaturedSlider";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

// Modern color theme with better contrast
const colors = {
  primary: "#FF5A5F", // Vibrant coral
  secondary: "#00A896", // Teal
  accent: "#FFB347", // Orange
  background: "#FAFAFA", // Very light gray
  text: "#2D3436", // Dark gray
  success: "#00B894", // Green
  warning: "#E17055", // Soft red
  light: "#FFFFFF",
  dark: "#2D3436",
};

// Font settings
const fonts = {
  heading: "'Poppins', sans-serif",
  body: "'Open Sans', sans-serif",
};
const socket = io("http://localhost:5000");
const categories = ["All", "Mains", "Starters", "Desserts", "Drinks"];

const usePendingOrders = () => {
  const [pendingOrders, setPendingOrders] = useState([]);

  const cancelPendingOrder = useCallback((foodId) => {
    setPendingOrders((prev) => {
      const orderToCancel = prev.find((item) => item.foodId === foodId);
      if (orderToCancel) {
        clearTimeout(orderToCancel.timeout);
        toast.error(`Cancelled adding ${orderToCancel.name}`, {
          icon: "❌",
          style: {
            background: colors.warning,
            color: colors.light,
          },
        });
      }
      return prev.filter((item) => item.foodId !== foodId);
    });
  }, []);

  const addPendingOrder = useCallback(
    (food) => {
      const alreadyPending = pendingOrders.some(
        (item) => item.foodId === food._id
      );
      if (alreadyPending) {
        toast("Already waiting to be added!", {
          icon: "⏳",
          style: {
            background: colors.accent,
            color: colors.text,
          },
        });
        return;
      }

      const newOrder = {
        foodId: food._id,
        name: food.name,
        quantity: 1,
        timeout: setTimeout(() => {
          setPendingOrders((prev) =>
            prev.filter((item) => item.foodId !== food._id)
          );
          toast.success(`${food.name} added to cart!`, {
            icon: "🛒",
            style: {
              background: colors.success,
              color: "#fff",
            },
          });
        }, 120000),
      };

      setPendingOrders((prev) => [...prev, newOrder]);

      const handleCancel = () => {
        cancelPendingOrder(food._id);
        toast.dismiss();
      };

      toast(
        () => (
          <div>
            We're confirming <b>{food.name}</b> in 2 mins. Wanna cancel?
            <button
              onClick={handleCancel}
              style={{
                marginLeft: "10px",
                background: colors.warning,
                color: "white",
                border: "none",
                padding: "2px 8px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        ),
        {
          icon: "⏳",
          style: {
            background: colors.accent,
            color: colors.text,
          },
          duration: 120000,
        }
      );
    },
    [cancelPendingOrder, pendingOrders]
  );

  return { pendingOrders, addPendingOrder, cancelPendingOrder };
};

const Menu = () => {
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const { pendingOrders, addPendingOrder, cancelPendingOrder } =
    usePendingOrders();
  const tableId = searchParams.get("table");

  const fetchFoods = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("http://localhost:5000/api/foods");
      setFoods(res.data);
    } catch (err) {
      console.error("Failed to fetch foods:", err);
      toast.error("Failed to load menu. Please try again later.", {
        style: {
          background: colors.warning,
          color: colors.light,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Welcome effect and sample item suggestion
  useEffect(() => {
    fetchFoods();

    const timer = setTimeout(() => {
      toast(
        <div style={{ fontFamily: fonts.body }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
            Welcome to Delicious Eats! 🎉
          </h3>
          <p style={{ margin: "8px 0 0", fontSize: "14px" }}>
            Try our chef's special today - the perfect meal awaits!
          </p>
        </div>,
        {
          duration: 5000,
          style: {
            background: colors.light,
            color: colors.text,
            border: `1px solid ${colors.primary}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          },
        }
      );
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    if (tableId) {
      socket.emit("joinTable", tableId);
    }

    socket.on("orderReady", (data) => {
      if (data.tableId === tableId) {
        toast.success(data.message, {
          icon: "📦",
          style: {
            background: "#ffa500",
            color: "#fff",
          },
        });

        // Optional: vibrate phone if supported
        if (window.navigator.vibrate) {
          window.navigator.vibrate([100, 50, 100]);
        }
      }
    });

    return () => {
      socket.off("orderReady");
    };
  }, [tableId]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback(
    (food) => {
      addPendingOrder(food);

      const timeoutId = setTimeout(() => {
        setCart((prev) => {
          const existingItem = prev.find((item) => item.foodId === food._id);
          const updatedCart = existingItem
            ? prev.map((item) =>
                item.foodId === food._id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            : [...prev, { foodId: food._id, quantity: 1, name: food.name }];

          if (!existingItem) {
            toast.success(`${food.name} added to cart!`, {
              icon: "🛒",
              style: {
                background: colors.success,
                color: colors.light,
              },
            });
          }

          return updatedCart;
        });
      }, 120000);

      return () => clearTimeout(timeoutId);
    },
    [addPendingOrder]
  );

  const placeOrder = async () => {
    if (!tableId) {
      toast.error("Please specify your table number!", {
        style: {
          background: colors.warning,
          color: colors.light,
        },
      });
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty!", {
        style: {
          background: colors.warning,
          color: colors.light,
        },
      });
      return;
    }

    try {
      setIsLoading(true);
      await axios.post("http://localhost:5000/api/orders", {
        tableId,
        items: cart.map((item) => ({
          foodId: item.foodId,
          quantity: item.quantity,
        })),
      });

      toast.success(
        <div>
          <p style={{ margin: 0, fontWeight: "600" }}>
            Order placed successfully! ✅
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px" }}>
            Your food will be served shortly.
          </p>
        </div>,
        {
          style: {
            background: colors.success,
            color: colors.light,
          },
        }
      );

      setCart([]);
      localStorage.removeItem("cart");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.", {
        style: {
          background: colors.warning,
          color: colors.light,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFoods = foods.filter((food) => {
    const matchesCategory =
      category === "All" || food.type?.toLowerCase() === category.toLowerCase();
    const matchesSearch = food.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) =>
      sum +
      (item.quantity * foods.find((f) => f._id === item.foodId)?.price || 0),
    0
  );

  const confirmOrder = () => {
    if (!tableId) {
      toast.error("Please specify your table number!", {
        style: {
          background: colors.warning,
          color: colors.light,
        },
      });
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty!", {
        style: {
          background: colors.warning,
          color: colors.light,
        },
      });
      return;
    }

    toast(
      (t) => (
        <div style={{ fontFamily: fonts.body }}>
          <h3
            style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 600 }}
          >
            Confirm Your Order
          </h3>
          <p style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
            You're about to place an order for {totalItems} items (₹{totalPrice}
            )
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                placeOrder();
              }}
              style={{
                flex: 1,
                background: colors.success,
                color: colors.light,
                border: "none",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => (e.target.style.opacity = "0.9")}
              onMouseOut={(e) => (e.target.style.opacity = "1")}
            >
              Confirm Order
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                flex: 1,
                background: "transparent",
                color: colors.text,
                border: `1px solid ${colors.text}20`,
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => (e.target.style.background = "#f5f5f5")}
              onMouseOut={(e) => (e.target.style.background = "transparent")}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        style: {
          background: colors.light,
          color: colors.text,
          border: `1px solid ${colors.primary}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      }
    );
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: colors.background,
        fontFamily: fonts.body,
        paddingBottom: cart.length > 0 ? "120px" : "0",
      }}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            padding: "16px",
            fontFamily: fonts.body,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          },
        }}
      />

      {/* Header Section */}
      <header
        style={{
          background: colors.light,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "24px",
                fontWeight: 700,
                color: colors.primary,
                fontFamily: fonts.heading,
              }}
            >
              Delicious Eats
            </h1>
            {tableId && (
              <div
                style={{
                  background: colors.secondary,
                  color: colors.light,
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Table: {tableId}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
              onClick={confirmOrder}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {totalItems > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      background: colors.primary,
                      color: colors.light,
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {totalItems}
                  </div>
                )}
              </div>
              <span
                style={{
                  color: colors.primary,
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                ₹{totalPrice}
              </span>
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        {/* Featured Slider */}
        <FeaturedSlider
          featuredFoods={foods.slice(0, 5)}
          onItemClick={(food) => {
            setSelectedFood(food);
            toast(
              <div style={{ fontFamily: fonts.body }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{food.name}</span>
                  <span style={{ fontWeight: 700 }}>₹{food.price}</span>
                </div>
                <button
                  onClick={() => {
                    addToCart(food);
                    toast.dismiss();
                  }}
                  style={{
                    width: "100%",
                    background: colors.primary,
                    color: colors.light,
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => (e.target.style.opacity = "0.9")}
                  onMouseOut={(e) => (e.target.style.opacity = "1")}
                >
                  Add to Cart
                </button>
              </div>,
              {
                duration: 6000,
                style: {
                  background: colors.light,
                  color: colors.text,
                  border: `1px solid ${colors.primary}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                },
              }
            );
          }}
        />

        {/* Search and Filter Section */}
        <section style={{ margin: "32px 0" }}>
          <div
            style={{
              position: "relative",
              marginBottom: "16px",
            }}
          >
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px 14px 48px",
                borderRadius: "12px",
                border: `1px solid ${colors.text}20`,
                fontSize: "16px",
                fontFamily: fonts.body,
                outline: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${colors.text}20`;
                e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
              }}
              aria-label="Search food items"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.text}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.6,
              }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "none",
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "20px",
                  border: "none",
                  background: category === cat ? colors.primary : colors.light,
                  color: category === cat ? colors.light : colors.text,
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow:
                    category === cat
                      ? `0 4px 12px ${colors.primary}40`
                      : "0 2px 8px rgba(0,0,0,0.05)",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  if (category !== cat) {
                    e.target.style.background = "#f5f5f5";
                  }
                }}
                onMouseOut={(e) => {
                  if (category !== cat) {
                    e.target.style.background = colors.light;
                  }
                }}
                aria-current={category === cat ? "true" : "false"}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Menu Items Section */}
        <section>
          {isLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "300px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: `4px solid ${colors.primary}20`,
                  borderTopColor: colors.primary,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: colors.text,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke={colors.text}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.5, marginBottom: "16px" }}
              >
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                No items found
              </h3>
              <p style={{ margin: 0, opacity: 0.7 }}>
                Try a different search or category
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={category + searchTerm}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "24px",
                }}
              >
                {filteredFoods.map((food) => (
                  <motion.div
                    key={food._id}
                    whileHover={{ y: -8 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFood(food)}
                    style={{
                      background: colors.light,
                      borderRadius: "16px",
                      overflow: "hidden",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      transition: "all 0.2s ease",
                      position: "relative",
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${food.name}`}
                  >
                    <div style={{ position: "relative", height: "180px" }}>
                      <img
                        src={food.image || "/food-placeholder.png"}
                        alt={food.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      {food.offer && (
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background: colors.accent,
                            color: colors.dark,
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        >
                          {food.offer}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "8px",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: 600,
                            color: colors.text,
                          }}
                        >
                          {food.name}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "18px",
                            fontWeight: 700,
                            color: colors.primary,
                          }}
                        >
                          ₹{food.price}
                        </p>
                      </div>

                      <p
                        style={{
                          margin: "0 0 12px 0",
                          fontSize: "14px",
                          color: `${colors.text}80`,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {food.description || "No description available."}
                      </p>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(food);
                          toast.success(`Adding ${food.name} to cart!`, {
                            icon: "➕",
                            style: {
                              background: colors.primary,
                              color: colors.light,
                            },
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "none",
                          background: colors.primary,
                          color: colors.light,
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => (e.target.style.opacity = "0.9")}
                        onMouseOut={(e) => (e.target.style.opacity = "1")}
                        aria-label={`Add ${food.name} to cart`}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        {/* Pending Orders Section */}
        {pendingOrders.length > 0 && (
          <section style={{ marginTop: "40px" }}>
            <div
              style={{
                background: colors.light,
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: colors.text,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.text}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Pending Additions
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {pendingOrders.map((item) => (
                  <div
                    key={item.foodId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: `${colors.primary}10`,
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          background: `${colors.primary}20`,
                          color: colors.primary,
                          padding: "4px 8px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        2 min
                      </div>
                      <button
                        onClick={() => cancelPendingOrder(item.foodId)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: colors.warning,
                          fontWeight: "bold",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.background = "#f5f5f5")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.background = "transparent")
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", damping: 25 }}
          style={{
            position: "fixed",
            bottom: "0",
            left: "0",
            right: "0",
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "16px 24px",
              background: colors.light,
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <div
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: colors.primary,
                    color: colors.light,
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {totalItems}
                </div>
              </div>
              <div>
                <p
                  style={{
                    margin: "0",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </p>
                <p
                  style={{
                    margin: "0",
                    fontSize: "18px",
                    fontWeight: "700",
                    color: colors.primary,
                  }}
                >
                  ₹{totalPrice}
                </p>
              </div>
            </div>
            <button
              onClick={confirmOrder}
              disabled={!tableId || isLoading}
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                border: "none",
                background:
                  !tableId || isLoading ? `${colors.text}20` : colors.primary,
                color: !tableId || isLoading ? colors.text : colors.light,
                fontSize: "16px",
                fontWeight: "600",
                cursor: !tableId || isLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseOver={(e) => {
                if (tableId && !isLoading) {
                  e.target.style.opacity = "0.9";
                  e.target.style.transform = "translateY(-2px)";
                }
              }}
              onMouseOut={(e) => {
                if (tableId && !isLoading) {
                  e.target.style.opacity = "1";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: `2px solid ${colors.text}20`,
                      borderTopColor: colors.text,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  Processing...
                </>
              ) : !tableId ? (
                "Select Table"
              ) : (
                <>
                  Place Order
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Food Detail Modal */}
      <AnimatePresence>
        {selectedFood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => setSelectedFood(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              style={{
                background: colors.light,
                borderRadius: "20px",
                width: "100%",
                maxWidth: "500px",
                maxHeight: "90vh",
                overflow: "hidden",
                position: "relative",
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ position: "relative", height: "250px" }}>
                <img
                  src={selectedFood.image || "/food-placeholder.png"}
                  alt={selectedFood.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {selectedFood.offer && (
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      left: "16px",
                      background: colors.accent,
                      color: colors.dark,
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    {selectedFood.offer}
                  </div>
                )}
                <button
                  onClick={() => setSelectedFood(null)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: colors.light,
                    color: colors.text,
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.transform = "rotate(90deg)")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.transform = "rotate(0deg)")
                  }
                  aria-label="Close food details"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div
                style={{
                  padding: "24px",
                  overflowY: "auto",
                  maxHeight: "calc(90vh - 250px)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: 700,
                      color: colors.text,
                      fontFamily: fonts.heading,
                    }}
                  >
                    {selectedFood.name}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: 700,
                      color: colors.primary,
                    }}
                  >
                    ₹{selectedFood.price}
                  </p>
                </div>

                <p
                  style={{
                    margin: "0 0 24px 0",
                    color: colors.text,
                    lineHeight: "1.6",
                  }}
                >
                  {selectedFood.description || "No description available."}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "24px",
                  }}
                >
                  <button
                    onClick={() => {
                      addToCart(selectedFood);
                      setSelectedFood(null);
                      toast.success(`${selectedFood.name} added to cart!`, {
                        icon: "🛒",
                        style: {
                          background: colors.success,
                          color: colors.light,
                        },
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: "12px",
                      border: "none",
                      background: colors.primary,
                      color: colors.light,
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                    onMouseOver={(e) => (e.target.style.opacity = "0.9")}
                    onMouseOut={(e) => (e.target.style.opacity = "1")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    Add to Cart
                  </button>
                  <button
                    onClick={() => {
                      const updatedCart = [
                        ...cart,
                        {
                          foodId: selectedFood._id,
                          quantity: 1,
                          name: selectedFood.name,
                        },
                      ];
                      setCart(updatedCart);
                      localStorage.setItem("cart", JSON.stringify(updatedCart));
                      setSelectedFood(null);

                      toast.success(
                        `${selectedFood.name} added and ordering...`,
                        {
                          icon: "⚡",
                          style: {
                            background: colors.success,
                            color: colors.light,
                          },
                        }
                      );

                      setTimeout(() => {
                        placeOrder();
                      }, 500);
                    }}
                    style={{
                      flex: 1,
                      padding: "14px",
                      borderRadius: "12px",
                      border: `2px solid ${colors.primary}`,
                      background: colors.light,
                      color: colors.primary,
                      fontSize: "16px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.background = `${colors.primary}10`)
                    }
                    onMouseOut={(e) =>
                      (e.target.style.background = colors.light)
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    Order Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Menu;
