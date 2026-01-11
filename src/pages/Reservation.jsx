// Reservation.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Container, Form, Button, Card, Row, Col, Badge } from "react-bootstrap";
import Navbar from "../components/Navbar";
import { formatPrice } from "../utils/formatters";
import { useToast, ToastProvider } from "../components/Toast";

export default function Reservation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurant, cart = [], table } = location.state || {};
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(table?.seats || 1);
  const [seatNumber, setSeatNumber] = useState(table?.seatNumber || "");
  const { showToast, removeToast, toasts } = useToast();

  if (!restaurant || !table) {
    return (
      <>
        <Navbar />
        <Container className="my-5 text-center">
          <p>Please select a restaurant and table first.</p>
          <Button
            style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
            onClick={() => navigate("/table-reservation")}
          >
            Back to Table Selection
          </Button>
        </Container>
      </>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const reservationDetails = {
      restaurant: restaurant.name,
      table: table.name,
      seatNumber: seatNumber,
      date,
      time,
      partySize,
      hasOrder: cart.length > 0,
    };
    
    // Navigate to payment method selection
    navigate("/payment-method", {
      state: {
        reservation: reservationDetails,
        cart,
        restaurant,
        customer: {}
      }
    });
  };

  const today = new Date().toISOString().split("T")[0];
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <Navbar />
      <ToastProvider toasts={toasts} removeToast={removeToast} />
      <Container className="my-5">
        <h3 className="mb-4">Reservation at {restaurant.name}</h3>
      
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Reservation Details</Card.Title>
              <p><strong>Table:</strong> {table.name}</p>
              <p><strong>Seat Number:</strong> {seatNumber}</p>
              <p><strong>Max Seats:</strong> {table.seats}</p>
            </Card.Body>
          </Card>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Time</Form.Label>
              <Form.Control
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Party Size</Form.Label>
              <Form.Control
                type="number"
                min={1}
                max={table.seats}
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Maximum {table.seats} seats available
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Seat Number</Form.Label>
              <Form.Control
                type="text"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                placeholder="Enter seat number (e.g., A1, B2)"
                required
              />
            </Form.Group>

            <Button
              type="submit"
              style={{
                background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
                border: "none",
              }}
            >
              Confirm Reservation
            </Button>
          </Form>
        </Col>

        <Col md={4}>
          {cart.length > 0 && (
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">Order Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                {cart.map((item, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="d-flex justify-content-between">
                        <span>{item.name} x {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
      </Container>
    </>
  );
}
