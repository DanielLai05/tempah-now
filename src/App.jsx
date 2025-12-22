import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/Login";
import AuthProvider from "./components/AuthProvider";
import AppProvider from "./context/AppContext.jsx";
import Home from "./pages/Home";
import HitPayCheckout from "./pages/HitPayCheckout";
import RestaurantDetails from "./pages/RestaurantDetails";
import ShoppingCart from "./pages/ShoppingCart";
import Reservation from "./pages/Reservation";
import OrderConfirmation from "./pages/OrderConfirmation";

// Staff Portal
import StaffLogin from "./pages/staff/StaffLogin";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOrders from "./pages/staff/StaffOrders";
import StaffReservations from "./pages/staff/StaffReservations";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

import "bootstrap/dist/css/bootstrap.min.css";

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/restaurant-details/:id" element={<RestaurantDetails />} />
            <Route path="/cart" element={<ShoppingCart />} />
            <Route path="/reservation" element={<Reservation />} />
            <Route path="/payment" element={<HitPayCheckout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />

            {/* Staff Portal */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/orders" element={<StaffOrders />} />
            <Route path="/staff/reservations" element={<StaffReservations />} />

            {/* Admin Portal */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  );
}
