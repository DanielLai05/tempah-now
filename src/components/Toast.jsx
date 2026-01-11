// Toast notification component
import React, { useState, useEffect } from "react";
import { Toast as BSToast, ToastContainer } from "react-bootstrap";

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { showToast, removeToast, toasts };
};

export const ToastProvider = ({ children, toasts, removeToast }) => {
  return (
    <>
      {children}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        {toasts.map((toast) => (
          <BSToast
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            show={true}
            delay={toast.duration}
            autohide
            bg={toast.type}
          >
            <BSToast.Header>
              <strong className="me-auto">
                {toast.type === "success" && "✓ Success"}
                {toast.type === "danger" && "✕ Error"}
                {toast.type === "warning" && "⚠ Warning"}
                {toast.type === "info" && "ℹ Info"}
              </strong>
            </BSToast.Header>
            <BSToast.Body>{toast.message}</BSToast.Body>
          </BSToast>
        ))}
      </ToastContainer>
    </>
  );
};

// Helper functions for common toast types
export const showSuccess = (showToast, message) => {
  return showToast(message, "success");
};

export const showError = (showToast, message) => {
  return showToast(message, "danger");
};

export const showWarning = (showToast, message) => {
  return showToast(message, "warning");
};

export const showInfo = (showToast, message) => {
  return showToast(message, "info");
};

