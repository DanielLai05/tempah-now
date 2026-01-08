// App.jsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/Login";
import AuthProvider from "./components/AuthProvider";
import AppProvider from "./context/AppContext.jsx";
import RoleProvider from "./context/RoleContext.jsx";
import Home from "./pages/Home";
import HitPayCheckout from "./pages/HitPayCheckout";
import RestaurantDetails from "./pages/RestaurantDetails";
import ShoppingCart from "./pages/ShoppingCart";
import Reservation from "./pages/Reservation";
import OrderConfirmation from "./pages/OrderConfirmation";
import VisualTableReservation from "./pages/VisualTableReservation.jsx";

// Staff Portal
import StaffLogin from "./pages/staff/StaffLogin";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOrders from "./pages/staff/StaffOrders";
import StaffReservations from "./pages/staff/StaffReservations";

// Admin Portal
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import ProtectedRoute from "./components/ProtectedRoute";

import "bootstrap/dist/css/bootstrap.min.css";

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <RoleProvider>
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
            <Route path="/table-reservation" element={<VisualTableReservation />} />

            {/* Staff Portal */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/orders" element={<StaffOrders />} />
            <Route path="/staff/reservations" element={<StaffReservations />} />

            {/* Admin Portal */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/restaurants" element={<AdminRestaurants />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/staff" element={<AdminStaff />} />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute requireManager={true}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </BrowserRouter>
        </RoleProvider>
      </AuthProvider>
    </AppProvider>
  );
}
