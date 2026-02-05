// App.jsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/Login";
import ResetPasswordPage from "./pages/ResetPassword";
import AuthProvider from "./components/AuthProvider";
import AppProvider from "./context/AppContext.jsx";
import RoleProvider from "./context/RoleContext.jsx";
import Home from "./pages/Home";
import HitPayCheckout from "./pages/HitPayCheckout";
import PaymentSuccess from "./pages/PaymentSuccess";
import RestaurantDetails from "./pages/RestaurantDetails";
import ShoppingCart from "./pages/ShoppingCart";
import Reservation from "./pages/Reservation";
import PaymentMethod from "./pages/PaymentMethod";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyReservations from "./pages/MyReservations";

// Staff Portal
import StaffLogin from "./pages/staff/StaffLogin";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffOrders from "./pages/staff/StaffOrders";
import StaffReservations from "./pages/staff/StaffReservations";
import StaffAnalytics from "./pages/staff/StaffAnalytics";
import StaffMenu from "./pages/staff/StaffMenu";
import StaffTables from "./pages/staff/StaffTables";

// Admin Portal
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AddRestaurant from "./pages/admin/AddRestaurant";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminStaff from "./pages/admin/AdminStaff";
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
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/restaurant-details/:id" element={<RestaurantDetails />} />
            <Route path="/cart" element={<ShoppingCart />} />
            <Route path="/reservation" element={<Reservation />} />
            <Route path="/payment-method" element={<PaymentMethod />} />
            <Route path="/payment" element={<HitPayCheckout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/my-reservations" element={<MyReservations />} />

            {/* Staff Portal */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route 
              path="/staff/dashboard" 
              element={
                <ProtectedRoute requireStaff={true}>
                  <StaffDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff/orders" 
              element={
                <ProtectedRoute requireStaff={true}>
                  <StaffOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff/reservations" 
              element={
                <ProtectedRoute requireStaff={true}>
                  <StaffReservations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff/analytics" 
              element={
                <ProtectedRoute requireStaff={true}>
                  <StaffAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff/menu" 
              element={
                <ProtectedRoute requireStaff={true}>
                  <StaffMenu />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/staff/tables" 
              element={
                <ProtectedRoute requireStaff={true}>
                  <StaffTables />
                </ProtectedRoute>
              } 
            />

            {/* Admin Portal */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/restaurants"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminRestaurants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/restaurants/add"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AddRestaurant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/restaurants/edit/:id"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AddRestaurant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminOrders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/reservations" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminReservations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/staff" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminStaff />
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
