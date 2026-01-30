// ProtectedRoute.jsx - Route protection based on role
import React, { useContext, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { RoleContext } from "../context/RoleContext";

export default function ProtectedRoute({ children, requireAdmin = false, requireStaff = false }) {
  const { userRole } = useContext(RoleContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have stored tokens in localStorage/sessionStorage
    const adminToken = localStorage.getItem('adminToken');
    const storedRole = sessionStorage.getItem('userRole');
    
    // If we have tokens but userRole is not set, consider it valid temporarily
    // The actual API call will validate the token
    if (adminToken || storedRole) {
      // Give time for RoleContext to initialize
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [userRole]);

  // If still loading, show a loading state or wait
  if (isLoading) {
    return (
      <div className="container my-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Verifying authentication...</p>
      </div>
    );
  }

  // If no role is set and no adminToken, redirect to login
  if (!userRole) {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      // We have a token but RoleContext hasn't initialized yet
      // Return children and let the actual page handle the API call
      return children;
    }
    
    // No token at all, redirect to login
    if (requireAdmin) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/staff/login" replace />;
  }

  // If admin access is required but user is not admin
  if (requireAdmin && userRole !== 'admin') {
    return (
      <div className="container my-5 text-center">
        <h3>Access Denied</h3>
        <p>You need admin privileges to access this page.</p>
        <a href="/admin/dashboard">Back to Dashboard</a>
      </div>
    );
  }

  // If staff access is required but user is not staff
  if (requireStaff && userRole !== 'staff') {
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
