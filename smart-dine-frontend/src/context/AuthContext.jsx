import React, { createContext, useState, useContext, useEffect } from "react";
import jwtDecode from "jwt-decode"; // fixed import
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Create the context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Get the base URL from Vite env or default to empty string
const BASE_URL = import.meta.env.VITE_API_URL || "";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check localStorage token on load
  useEffect(() => {
    const token = localStorage.getItem("citrus_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired, logging out.");
          localStorage.removeItem("citrus_token");
          setUser(null);
        } else {
          setUser({ id: decoded.id, role: decoded.role, token });
        }
      } catch (err) {
        console.error("Invalid token in localStorage", err);
        localStorage.removeItem("citrus_token");
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      if (data.success && data.token) {
        const decoded = jwtDecode(data.token);

        const userData = {
          id: decoded.id,
          role: decoded.role,
          token: data.token,
        };
        setUser(userData);
        localStorage.setItem("citrus_token", data.token);

        // Redirect based on role
        if (userData.role === "admin") navigate("/owner-dashboard");
        else if (userData.role === "chef") navigate("/chef-dashboard");
        else navigate("/menu");

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

  const logout = () => {
    setUser(null);
    localStorage.removeItem("citrus_token");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
