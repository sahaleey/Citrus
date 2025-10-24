import React from "react";
import { NavLink, Link, useLocation, useSearchParams } from "react-router-dom";
import {
  Citrus,
  LogOut,
  User,
  ChefHat,
  LayoutDashboard,
  Utensils,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Helper for NavLink styling
const navLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-[var(--primary-color)] text-[var(--text-on-primary)]"
      : "text-[var(--text-color-secondary)] hover:bg-gray-100 hover:text-[var(--text-color)]"
  }`;

const Header = () => {
  const { user, logout } = useAuth();

  // Get current table from URL query
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table") || "default-1";

  // Construct menu link preserving table
  const menuLink = `/menu?table=${tableId}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--surface-color)] shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        {/* Logo */}
        <div className="flex items-center gap-2" aria-label="Home">
          <img
            src="/images/logo.jpg"
            alt=""
            srcset=""
            className="max-sm:size-10 size-15 rounded-4xl border border-[var(--border-color)] object-cover"
          />
          <span className="text-2xl font-bold text-[var(--text-color)]">
            Citrus
          </span>
        </div>

        {/* Role-Based Navigation */}
        <nav className="flex items-center gap-2">
          {/* --- ADMIN LINKS --- */}
          {user && user.role === "admin" && (
            <>
              <NavLink to={menuLink} className={navLinkClass} end>
                <Utensils size={16} />
                <span>Menu</span>
              </NavLink>
              <NavLink to="/chef-dashboard" className={navLinkClass}>
                <ChefHat size={16} />
                <span>Chef View</span>
              </NavLink>
              <NavLink to="/owner-dashboard" className={navLinkClass}>
                <LayoutDashboard size={16} />
                <span>Owner View</span>
              </NavLink>
            </>
          )}

          {/* --- CHEF LINKS --- */}
          {user && user.role === "chef" && (
            <>
              <NavLink to={menuLink} className={navLinkClass} end>
                <Utensils size={16} />
                <span>Menu</span>
              </NavLink>
              <NavLink to="/chef-dashboard" className={navLinkClass}>
                <ChefHat size={16} />
                <span>Chef View</span>
              </NavLink>
            </>
          )}

          {/* --- LOGIN/LOGOUT BUTTON --- */}
          {user ? (
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-[var(--text-color-secondary)] hover:bg-gray-200"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-[var(--text-color-secondary)] hover:bg-gray-200"
              aria-label="Admin/Chef Login"
            >
              <User size={16} />
              <span>Staff Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
