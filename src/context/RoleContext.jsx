// RoleContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";

export const RoleContext = createContext();

export default function RoleProvider({ children }) {
  const [userRole, setUserRole] = useState(null); // 'staff', 'admin' or null
  const [userRestaurantId, setUserRestaurantId] = useState(null); // Restaurant ID for staff

  const setRole = (role, restaurantId = null) => {
    setUserRole(role);
    setUserRestaurantId(restaurantId);
    // Store in sessionStorage for persistence
    sessionStorage.setItem('userRole', role);
    if (restaurantId) {
      sessionStorage.setItem('userRestaurantId', restaurantId.toString());
    }
  };

  const clearRole = () => {
    setUserRole(null);
    setUserRestaurantId(null);
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userRestaurantId');
  };

  // Load role from sessionStorage or localStorage on mount
  useEffect(() => {
    const storedRole = sessionStorage.getItem('userRole');
    const storedRestaurantId = sessionStorage.getItem('userRestaurantId');
    const adminToken = localStorage.getItem('adminToken');
    const staffToken = localStorage.getItem('staffToken');
    
    if (storedRole) {
      setUserRole(storedRole);
      if (storedRestaurantId) {
        setUserRestaurantId(parseInt(storedRestaurantId));
      }
    } else if (adminToken) {
      // Admin token exists but role not loaded yet
      setUserRole('admin');
    } else if (staffToken) {
      // Staff token exists but role not loaded yet
      setUserRole('staff');
    }
  }, []);

  return (
    <RoleContext.Provider value={{
      userRole,
      userRestaurantId,
      setRole,
      clearRole,
      isStaff: userRole === 'staff',
      isAdmin: userRole === 'admin',
    }}>
      {children}
    </RoleContext.Provider>
  );
}
