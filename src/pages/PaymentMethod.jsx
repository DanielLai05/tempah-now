// PaymentMethod.jsx - Payment method selection page
import React from "react";
import { Container, Card, Row, Col, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { formatPrice } from "../utils/formatters";

export default function PaymentMethod() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reservation, cart = [], restaurant, customer = {} } = location.state || {};

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasOrder = cart.length > 0;

  // Helper to safely format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';

    try {
      // Handle ISO format with T and timezone (e.g., "2026-01-30T16:00:00.000Z")
      let date;
      if (typeof dateStr === 'string' && (dateStr.includes('T') || dateStr.includes('-'))) {
        // Try to parse the date
        date = new Date(dateStr);
      } else {
        date = new Date(dateStr);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateStr;
      }

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      } catch (error) {
      console.error('Date formatting error:', error);
      return dateStr;
      }
    };
    
  // Helper to format time
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';

    try {
      // Handle different time formats
      let hours, minutes;

      // If time includes date (ISO format)
      if (typeof timeStr === 'string' && timeStr.includes('T')) {
        const date = new Date(timeStr);
        hours = date.getHours();
        minutes = date.getMinutes();
      } else if (typeof timeStr === 'string' && timeStr.includes(':')) {
        // Simple HH:MM or HH:MM:SS format
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
    } catch (error) {
      console.error('Time formatting error:', error);
      return timeStr;
    }
  };

  // Extract reservation info from either format
  const getReservationInfo = () => {
    if (!reservation) return null;

    // Handle different data formats
    if (reservation.reservation_date) {
      // Database format (from API response)
      return {
        restaurant: reservation.restaurant_name || restaurant?.name || reservation.restaurant,
        date: formatDate(reservation.reservation_date),
        time: formatTime(reservation.reservation_time || reservation.time),
        partySize: reservation.party_size || reservation.partySize,
        table: reservation.table_id || reservation.table || '-'
      };
    }

    // Local format (from navigation state - before API call)
    return {
      restaurant: reservation.restaurant || restaurant?.name,
      date: formatDate(reservation.date),
      time: formatTime(reservation.time),
      partySize: reservation.partySize || '-',
      table: reservation.table || '-'
    };
  };

  const reservationInfo = getReservationInfo();

  const handlePaymentMethod = (method) => {
      const orderData = {
        reservation,
        cart,
        restaurant,
        customer,
        paymentMethod: method,
        subtotal,
      };

      if (method === "counter") {
        // Pay at counter - go directly to confirmation
        navigate("/order-confirmation", { state: orderData });
      } else if (method === "gateway") {
        // Pay via gateway - go to payment gateway
        navigate("/payment", { state: orderData });
      }
  };

  return (
    <>
      <Navbar />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="shadow-sm border-0" style={{ borderRadius: "16px" }}>
              <Card.Header className="bg-light">
                <h3 className="mb-0 fw-bold">Select Payment Method</h3>
              </Card.Header>
              <Card.Body className="p-4">
                {/* Order Summary */}
                {hasOrder && (
                  <div className="mb-4 p-3 bg-light rounded">
                    <h5 className="mb-3">Order Summary</h5>
                    {cart.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between mb-2">
                        <span>{item.name} x {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <hr />
                    <div className="d-flex justify-content-between fw-bold fs-5">
                      <span>Total:</span>
                      <span className="text-primary">{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                )}

                {/* Reservation Info */}
                {reservationInfo && (
                  <div className="mb-4 p-3 bg-light rounded">
                    <h5 className="mb-3">Reservation Details</h5>
                    <p className="mb-1">
                      <i className="bi bi-shop me-2"></i>
                      <strong>Restaurant:</strong> {reservationInfo.restaurant || '-'}
                    </p>
                    <p className="mb-1">
                      <i className="bi bi-calendar-event me-2"></i>
                      <strong>Date:</strong> {reservationInfo.date}
                    </p>
                    <p className="mb-1">
                      <i className="bi bi-clock me-2"></i>
                      <strong>Time:</strong> {reservationInfo.time}
                    </p>
                    <p className="mb-1">
                      <i className="bi bi-people me-2"></i>
                      <strong>Party Size:</strong> {reservationInfo.partySize} people
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-grid me-2"></i>
                      <strong>Table:</strong> #{reservationInfo.table}
                    </p>
                  </div>
                )}

                {/* Payment Methods */}
                <div className="mb-4">
                  <h5 className="mb-4">Choose your payment method:</h5>
                  
                  <Row className="g-3">
                    {/* Pay at Counter */}
                    <Col md={6}>
                      <Card
                        className="h-100 border-2"
                        style={{
                          cursor: "pointer",
                          borderRadius: "12px",
                          transition: "all 0.3s",
                          borderColor: "#e0e0e0",
                        }}
                        onClick={() => handlePaymentMethod("counter")}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#FF7E5F";
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 16px rgba(255, 126, 95, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e0e0e0";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <Card.Body className="text-center p-4">
                          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💳</div>
                          <h5 className="fw-bold mb-2">Pay at Counter</h5>
                          <p className="text-muted mb-3">
                            Pay when you arrive at the restaurant
                          </p>
                          <Button
                            variant="outline-primary"
                            className="w-100"
                            style={{
                              borderColor: "#FF7E5F",
                              color: "#FF7E5F",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#FF7E5F";
                              e.currentTarget.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "#FF7E5F";
                            }}
                          >
                            Select
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Pay via Gateway */}
                    <Col md={6}>
                      <Card
                        className="h-100 border-2"
                        style={{
                          cursor: "pointer",
                          borderRadius: "12px",
                          transition: "all 0.3s",
                          borderColor: "#e0e0e0",
                        }}
                        onClick={() => handlePaymentMethod("gateway")}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#FF7E5F";
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 8px 16px rgba(255, 126, 95, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e0e0e0";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <Card.Body className="text-center p-4">
                          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌐</div>
                          <h5 className="fw-bold mb-2">Pay Online</h5>
                          <p className="text-muted mb-3">
                            Secure online payment via payment gateway
                          </p>
                          <Button
                            variant="outline-primary"
                            className="w-100"
                            style={{
                              borderColor: "#FF7E5F",
                              color: "#FF7E5F",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#FF7E5F";
                              e.currentTarget.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                              e.currentTarget.style.color = "#FF7E5F";
                            }}
                          >
                            Select
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>

                {/* Back Button */}
                <div className="text-center">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate(-1)}
                  >
                    ← Back
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
