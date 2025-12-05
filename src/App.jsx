import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import LoginPage from "./pages/Login";
import AuthProvider from "./components/AuthProvider";
import Home from "./pages/Home";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="*" element={<Navigate to='/login' />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

