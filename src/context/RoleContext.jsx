// RoleContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";

export const RoleContext = createContext();

export default function RoleProvider({ children }) {
  const [userRole, setUserRole] = useState(null); // 'manager', 'staff', or null
  const [userRestaurantId, setUserRestaurantId] = useState(null); // Restaurant ID for staff/manager

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

  // Load role from sessionStorage on mount
  useEffect(() => {
    const storedRole = sessionStorage.getItem('userRole');
    const storedRestaurantId = sessionStorage.getItem('userRestaurantId');
    if (storedRole) {
      setUserRole(storedRole);
      if (storedRestaurantId) {
        setUserRestaurantId(parseInt(storedRestaurantId));
      }
    }
  }, []);

  return (
    <RoleContext.Provider value={{
      userRole,
      userRestaurantId,
      setRole,
      clearRole,
      isManager: userRole === 'manager',
      isStaff: userRole === 'staff',
    }}>
      {children}
    </RoleContext.Provider>
  );
}

