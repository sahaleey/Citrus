import React, { createContext, useState, useContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // <-- The helper we just installed
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Create the context
const AuthContext = createContext();

// Create a custom hook to use the context easily
export const useAuth = () => {
  return useContext(AuthContext);
};

// Create the "Provider" component that will wrap our app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start as true to check for token
  const navigate = useNavigate();

  // --- Check for an existing token on app load ---
  useEffect(() => {
    try {
      const token = localStorage.getItem("citrus_token");
      if (token) {
        const decodedToken = jwtDecode(token);

        // Check if token is expired
        if (decodedToken.exp * 1000 < Date.now()) {
          console.log("Token expired, logging out.");
          localStorage.removeItem("citrus_token");
          setUser(null);
        } else {
          // Token is valid! Set the user
          setUser({
            id: decodedToken.id,
            role: decodedToken.role,
            token: token,
          });
        }
      }
    } catch (e) {
      console.error("Invalid token found in localStorage", e);
      localStorage.removeItem("citrus_token");
      setUser(null);
    } finally {
      setLoading(false); // Done checking
    }
  }, []);

  // --- Login Function ---
  const login = async (email, password) => {
    setLoading(true);
    try {
      // Call our backend login route (via the Vite proxy)
      const { data } = await axios.post("/api/auth/login", {
        email,
        password,
      });

      if (data.success && data.token) {
        // --- Login Success! ---
        const decodedToken = jwtDecode(data.token);

        // 1. Save user to state
        const userData = {
          id: decodedToken.id,
          role: decodedToken.role,
          token: data.token,
        };
        setUser(userData);

        // 2. Save token to localStorage
        localStorage.setItem("citrus_token", data.token);

        // 3. Redirect to the correct dashboard
        if (userData.role === "admin") {
          navigate("/owner-dashboard");
        } else if (userData.role === "chef") {
          navigate("/chef-dashboard");
        } else {
          navigate("/menu");
        }
        return { success: true };
      }
    } catch (err) {
      console.error("Login failed:", err);
      const message =
        err.response?.data?.message || "Invalid email or password";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // --- Logout Function ---
  const logout = () => {
    setUser(null);
    localStorage.removeItem("citrus_token");
    navigate("/login"); // Send to login page after logout
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  // Provide the context to all child components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
