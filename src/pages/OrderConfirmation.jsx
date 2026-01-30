// OrderConfirmation.jsx
import React, { useContext, useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Card, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import Navbar from "../components/Navbar";
import { formatPrice } from "../utils/formatters";
import { AppContext } from "../context/AppContext";
import { orderAPI } from "../services/api";

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useContext(AppContext);
  const cartCleared = useRef(false);
  const orderCreated = useRef(false); // Track if order was already created for this cart
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [orderError, setOrderError] = useState(null);

  // Safely get state - handle null/undefined
  const state = location.state || {};
  const existingOrder = state.order || null;
  const reservation = state.reservation || null;
  const message = state.message || "Your order has been placed successfully!";
  const cart = state.cart || [];
  const restaurant = state.restaurant || {};
  const subtotal = state.subtotal || 0;

  // Create order if one doesn't exist (for "Pay at Counter" flow)
  useEffect(() => {
    const createOrderIfNeeded = async () => {
      // Skip if order already exists or no cart items
      if (existingOrder || cart.length === 0) return;

      // Skip if already created for this cart (useRef)
      if (orderCreated.current) {
        console.log('Skipping - order already created for this cart');
        return;
      }

      // Check sessionStorage to prevent duplicate orders from page refresh/navigation
      const cartKey = cart.map(item => `${item.menuItemId || item.id}-${item.quantity}`).join(',');
      const lastOrderKey = sessionStorage.getItem('lastOrderKey');
      const lastOrderTime = sessionStorage.getItem('lastOrderTime');
      const now = Date.now();

      // If same cart was ordered within last 10 seconds, skip (longer window for safety)
      if (lastOrderKey === cartKey && lastOrderTime && (now - parseInt(lastOrderTime)) < 10000) {
        console.log('Skipping duplicate order creation (same cart within 10 seconds)');
        // Mark as created so we don't try again
        orderCreated.current = true;
        return;
      }

      // Mark as creating
      orderCreated.current = true;
      setCreatingOrder(true);
      setOrderError(null);
      
      try {
        console.log('Creating order for cart:', cart);
        
        const orderResult = await orderAPI.create({
          reservation_id: reservation?.id || null,
          notes: `Order for ${restaurant?.name || 'Restaurant'}`,
          items: cart.map(item => ({
            item_id: item.menuItemId || item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          total_amount: subtotal,
          restaurant_id: restaurant?.id
        });

        console.log('Order created successfully:', orderResult);
        setCreatedOrder(orderResult.order);
        
        // Store the cart key and time to prevent duplicates
        sessionStorage.setItem('lastOrderKey', cartKey);
        sessionStorage.setItem('lastOrderTime', now.toString());
        
      } catch (err) {
        console.error('Error creating order:', err);
        setOrderError('Failed to save order: ' + (err.message || 'Unknown error'));
        // Don't show full error to user
      } finally {
        setCreatingOrder(false);
      }
    };

    createOrderIfNeeded();
  }, [existingOrder, cart, restaurant, subtotal, reservation, creatingOrder]);

  // Clear cart only once when component mounts
  useEffect(() => {
    if (cart && cart.length > 0 && !cartCleared.current) {
      cartCleared.current = true;
      clearCart();
    }
  }, [cart, clearCart]);

  // If no order/reservation data, show error
  if (!createdOrder && !existingOrder && !reservation && cart.length === 0) {
    return (
      <>
        <Navbar />
        <Container className="my-5 text-center">
          <Alert variant="warning">
            <h4>No Confirmation Data</h4>
            <p>We couldn't find your order or reservation details.</p>
          </Alert>
          <Button
            style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
            onClick={() => navigate("/home")}
          >
            Go to Home
          </Button>
        </Container>
      </>
    );
  }

  // Use created order or existing order
  const order = createdOrder || existingOrder;

  const calculateCartTotal = () => {
    if (!cart || cart.length === 0) return 0;
    return cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  };
  
  const cartTotal = subtotal || calculateCartTotal();

  // Helper to format currency safely
  const safeFormatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '$0.00';
    }
    return formatPrice(amount);
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to format time
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    try {
      let hours, minutes;
      if (typeof timeStr === 'string' && timeStr.includes('T')) {
        const date = new Date(timeStr);
        hours = date.getHours();
        minutes = date.getMinutes();
      } else if (typeof timeStr === 'string' && timeStr.includes(':')) {
        const parts = timeStr.split(':');
        hours = parseInt(parts[0]);
        minutes = parseInt(parts[1]);
      } else {
        return timeStr;
      }
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      const minStr = minutes.toString().padStart(2, '0');
      return `${h12}:${minStr} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Navigate to home
  const handleBackToHome = () => {
    // Clear any session storage
    sessionStorage.removeItem('lastOrderKey');
    sessionStorage.removeItem('lastOrderTime');
    navigate("/home");
  };

  // Navigate to my reservations
  const handleViewReservations = () => {
    sessionStorage.removeItem('lastOrderKey');
    sessionStorage.removeItem('lastOrderTime');
    navigate("/my-reservations");
  };

  return (
    <>
      <Navbar />
      <Container className="my-5">
        {/* Loading indicator */}
        {creatingOrder && (
          <Alert variant="info" className="mb-4">
            <Spinner animation="border" size="sm" className="me-2" />
            Processing your order... Please wait.
          </Alert>
        )}

        {/* Error indicator */}
        {orderError && (
          <Alert variant="warning" className="mb-4">
            {orderError}
          </Alert>
        )}

        {/* Success Message */}
        <div className="text-center mb-5">
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <i className="bi bi-check-lg text-white" style={{ fontSize: "2.5rem" }}></i>
          </div>
          <h2 className="fw-bold text-success">Booking Confirmed!</h2>
          <p className="text-muted">{message}</p>
        </div>

        {/* Reservation Details */}
        {reservation && (
          <Row className="justify-content-center mb-4">
            <Col md={8}>
              <Card className="shadow-sm">
                <Card.Header style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", color: "white", border: "none" }}>
                  <Card.Title className="mb-0">Reservation Details</Card.Title>
                </Card.Header>
                <Card.Body>
                  {reservation.restaurant_name && (
                    <p><strong>Restaurant:</strong> {reservation.restaurant_name}</p>
                  )}
                  {reservation.restaurant && !reservation.restaurant_name && (
                    <p><strong>Restaurant:</strong> {reservation.restaurant}</p>
                  )}
                  <p><strong>Date:</strong> {formatDate(reservation.reservation_date || reservation.date)}</p>
                  <p><strong>Time:</strong> {formatTime(reservation.reservation_time || reservation.time)}</p>
                  <p><strong>Party Size:</strong> {reservation.party_size || reservation.partySize} guests</p>
                  <p><strong>Status:</strong>
                    <span className="badge bg-warning text-dark ms-2">{reservation.status}</span>
                  </p>
                  {reservation.special_requests && (
                    <p><strong>Special Requests:</strong> {reservation.special_requests}</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Order Details */}
        {order && (
          <Row className="justify-content-center mb-4">
            <Col md={8}>
              <Card className="shadow-sm">
                <Card.Header style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", color: "white", border: "none" }}>
                  <Card.Title className="mb-0">Food Order Details</Card.Title>
                </Card.Header>
                <Card.Body>
                  <p><strong>Order ID:</strong> #{order.id}</p>
                  <p><strong>Total:</strong> {safeFormatCurrency(order.total_amount)}</p>
                  <p><strong>Status:</strong>
                    <span className="badge bg-warning text-dark ms-2">{order.status || 'pending'}</span>
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Cart Items (if any) */}
        {cart && cart.length > 0 && (
          <Row className="justify-content-center mb-4">
            <Col md={8}>
              <Card className="shadow-sm">
                <Card.Header>
                  <Card.Title className="mb-0">Order Summary</Card.Title>
                </Card.Header>
                <Card.Body>
                  {cart.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between mb-2">
                      <span>{item.name} x {item.quantity}</span>
                      <span>{safeFormatCurrency((item.price || 0) * (item.quantity || 0))}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Total:</span>
                    <span>{safeFormatCurrency(cartTotal)}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Actions */}
        <div className="text-center mt-4">
          <Button
            variant="primary"
            className="me-3"
            style={{
              background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
              border: "none",
              cursor: "pointer"
            }}
            onClick={handleBackToHome}
          >
            Back to Home
          </Button>
          <Button
            variant="outline-secondary"
            style={{ cursor: "pointer" }}
            onClick={handleViewReservations}
          >
            View My Reservations
          </Button>
        </div>
      </Container>
    </>
  );
}
