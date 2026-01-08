// src/context/AppContext.jsx
import React, { createContext, useState } from "react";

export const AppContext = createContext();

export default function AppProvider({ children }) {
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);

  const addToCart = (item, qty = 1) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + qty } : i);
      } else {
        return [...prev, { ...item, quantity: qty }];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{
      selectedRestaurant,
      setSelectedRestaurant,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart
    }}>
      {children}
    </AppContext.Provider>
  );
}
