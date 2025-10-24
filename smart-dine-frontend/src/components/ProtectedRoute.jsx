import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner"; // We need a loading spinner

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Show spinner while context is checking for a token
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner text="Checking credentials..." />
      </div>
    );
  }

  // 2. If no user, redirect to login. Save where they *tried* to go.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If user has the wrong role, kick them out to the menu.
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/menu" replace />;
  }

  // 4. If all checks pass, show the protected page!
  return children;
};

export default ProtectedRoute;
