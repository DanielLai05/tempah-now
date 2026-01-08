// ProtectedRoute.jsx - Route protection based on role
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { RoleContext } from "../context/RoleContext";

export default function ProtectedRoute({ children, requireManager = false, requireStaff = false }) {
  const { isManager, isStaff, userRole } = useContext(RoleContext);

  // If no role is set, redirect to login
  if (!userRole) {
    return <Navigate to="/staff/login" replace />;
  }

  // If manager access is required but user is not manager
  if (requireManager && !isManager) {
    return (
      <div className="container my-5 text-center">
        <h3>Access Denied</h3>
        <p>You need manager privileges to access this page.</p>
        <a href="/staff/dashboard">Back to Dashboard</a>
      </div>
    );
  }

  // If staff access is required but user is not staff
  if (requireStaff && !isStaff) {
    return (
      <div className="container my-5 text-center">
        <h3>Access Denied</h3>
        <p>You need staff privileges to access this page.</p>
        <a href="/staff/dashboard">Back to Dashboard</a>
      </div>
    );
  }

  return children;
}


