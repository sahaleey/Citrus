import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Citrus, KeyRound, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Find out where the user was trying to go (if they were redirected)
  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Please enter both email and password.");
    }

    const result = await login(email, password);

    if (!result.success) {
      toast.error(result.message);
    } else {
      toast.success("Login successful! Redirecting...");
      // If we know where they came from, send them back.
      // Otherwise, AuthContext will handle the role-based redirect.
      if (from) {
        navigate(from, { replace: true });
      }
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-[var(--background-color)]">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-8 shadow-lg">
        <div className="text-center">
          <img
            src="/images/logo.jpg"
            alt=""
            srcSet=""
            className="flex items-center justify-center mx-auto mb-4 h-16 w-16 rounded-full object-cover shadow-md scale-120 hover:scale-125 transition-transform"
          />
          <h2 className="text-3xl font-bold text-[var(--text-color)]">
            Admin & Chef Login
          </h2>
          <p className="mt-2 text-[var(--text-color-secondary)]">
            Welcome to Citrus Restaurant.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-[var(--text-color)]"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-2.5 text-[var(--text-color)] placeholder:text-[var(--text-color-secondary)] focus:border-[var(--primary-color)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
              placeholder="admin@citrus.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-[var(--text-color)]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[var(--border-color)] bg-transparent px-3 py-2.5 text-[var(--text-color)] placeholder:text-[var(--text-color-secondary)] focus:border-[var(--primary-color)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-4 py-3 text-sm font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--primary-color-dark)] hover:shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <KeyRound size={18} />
            )}
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-color-secondary)]">
          Customers can order directly from the menu.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
