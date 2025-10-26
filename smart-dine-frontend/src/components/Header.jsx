import React, { useState } from "react";
import { NavLink, Link, useSearchParams } from "react-router-dom";
import {
  Citrus,
  LogOut,
  User,
  ChefHat,
  LayoutDashboard,
  Utensils,
  Menu as MenuIcon,
  X as CloseIcon,
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
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table") || "default-1";
  const menuLink = `/menu?table=${tableId}`;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  // Close mobile menu when clicking a nav link
  const closeMenu = () => setIsMenuOpen(false);

  // Determine which nav items to show
  const renderNavLinks = () => {
    if (!user) return null;

    if (user.role === "admin") {
      return (
        <>
          <NavLink
            to={menuLink}
            className={navLinkClass}
            end
            onClick={closeMenu}
          >
            <Utensils size={16} />
            <span>Menu</span>
          </NavLink>
          <NavLink
            to="/chef-dashboard"
            className={navLinkClass}
            onClick={closeMenu}
          >
            <ChefHat size={16} />
            <span>Chef View</span>
          </NavLink>
          <NavLink
            to="/owner-dashboard"
            className={navLinkClass}
            onClick={closeMenu}
          >
            <LayoutDashboard size={16} />
            <span>Owner View</span>
          </NavLink>
        </>
      );
    }

    if (user.role === "chef") {
      return (
        <>
          <NavLink
            to={menuLink}
            className={navLinkClass}
            end
            onClick={closeMenu}
          >
            <Utensils size={16} />
            <span>Menu</span>
          </NavLink>
          <NavLink
            to="/chef-dashboard"
            className={navLinkClass}
            onClick={closeMenu}
          >
            <ChefHat size={16} />
            <span>Chef View</span>
          </NavLink>
        </>
      );
    }

    return null;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-color)] bg-[var(--surface-color)] shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        {/* Logo */}
        <div className="flex items-center gap-2" aria-label="Home">
          <img
            src="/images/logo.jpg"
            alt="Citrus Logo"
            className="size-10 rounded-2xl border border-[var(--border-color)] object-cover sm:size-12 md:size-15"
          />
          <span className="text-xl font-bold text-[var(--text-color)] sm:text-2xl">
            Citrus
          </span>
        </div>

        {/* Desktop Navigation (hidden on mobile) */}
        <nav className="hidden items-center gap-2 md:flex">
          {renderNavLinks()}
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
              aria-label="Staff Login"
            >
              <User size={16} />
              <span className="max-sm:hidden">Staff Login</span>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <CloseIcon size={24} className="text-[var(--text-color)]" />
          ) : (
            <MenuIcon size={24} className="text-[var(--text-color)]" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="border-t border-[var(--border-color)] bg-[var(--surface-color)] px-4 py-3">
            <nav className="flex flex-col gap-2">
              {renderNavLinks()}
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-[var(--text-color-secondary)] hover:bg-gray-200"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-[var(--text-color-secondary)] hover:bg-gray-200"
                  onClick={closeMenu}
                >
                  <User size={16} />
                  <span>Staff Login</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
