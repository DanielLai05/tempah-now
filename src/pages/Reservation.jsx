// Reservation.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { Container, Form, Button, Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import Navbar from "../components/Navbar";
import { formatPrice } from "../utils/formatters";
import { useToast, ToastProvider } from "../components/Toast";
import { AppContext } from "../context/AppContext";
import { reservationAPI, authAPI } from "../services/api";
import { auth } from "../firebase";

export default function Reservation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurant, cart = [], table, reservationDetails } = location.state || {};
  const { clearCart } = useContext(AppContext);

  const [date, setDate] = useState(reservationDetails?.date || "");
  const [time, setTime] = useState(reservationDetails?.time || "");
  const [pax, setPax] = useState(reservationDetails?.pax || table?.seats || 1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);

  const { showToast, removeToast, toasts } = useToast();

  // Get user profile
  useEffect(() => {
    const getProfile = async () => {
      try {
        const profileData = await authAPI.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Error getting profile:', error);
      }
    };
    
    if (auth.currentUser) {
      getProfile();
    }
  }, []);

  if (!restaurant || !table) {
    return (
      <>
        <Navbar />
        <ToastProvider toasts={toasts} removeToast={removeToast} />
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !time) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    setSubmitting(true);

    try {
      // Create reservation with correct data format
      const reservationData = {
        restaurant_id: restaurant.id,
        table_id: table.id,
        reservation_date: date,
        reservation_time: time,
        party_size: parseInt(pax),
        special_requests: specialRequests || null,
        customer_name: profile?.first_name + ' ' + profile?.last_name || '',
        customer_phone: profile?.phone || '',
        customer_email: profile?.email || auth.currentUser?.email || ''
      };

      const result = await reservationAPI.create(reservationData);

      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (subtotal === 0) {
        // No food order, go directly to confirmation
        showToast("Reservation created successfully!", "success");
        navigate("/order-confirmation", {
          state: {
            order: null,
            reservation: result.reservation,
            message: "Your table reservation has been confirmed!"
          }
        });
      } else {
        // Has food order, go to payment
        navigate("/payment-method", {
          state: {
            reservation: result.reservation,
            cart,
            restaurant,
            customer: profile
          }
        });
      }
    } catch (error) {
      console.error('Reservation error:', error);
      showToast(error.message || "Failed to create reservation", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <Navbar />
      <ToastProvider toasts={toasts} removeToast={removeToast} />
      <Container className="my-5">
        <h3 className="mb-4">Confirm Reservation at {restaurant.name}</h3>

        <Row>
          <Col md={8}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Selected Table</Card.Title>
                <Row>
                  <Col md={6}>
                    <p><strong>Table ID:</strong> {table.id}</p>
                    <p><strong>Seat Number:</strong> {table.seatNumber || 'A1'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Capacity:</strong> {table.seats} seats</p>
                    <p><strong>Party Size:</strong> {pax} guests</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Reservation Date <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Reservation Time <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Number of Guests</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max={table.seats}
                  value={pax}
                  onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                  required
                />
                <Form.Text className="text-muted">
                  Maximum {table.seats} guests for this table
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Special Requests (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests? (e.g., high chair, wheelchair access, allergies)"
                />
              </Form.Group>

              <div className="d-flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/table-reservation")}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
                    border: "none",
                  }}
                >
                  {submitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Creating Reservation...
                    </>
                  ) : (
                    cart.length > 0 ? "Continue to Payment" : "Confirm Reservation"
                  )}
                </Button>
              </div>
            </Form>
          </Col>

          <Col md={4}>
            {/* Cart Summary */}
            {cart.length > 0 && (
              <Card className="mb-4">
                <Card.Header>
                  <Card.Title className="mb-0">Food Order Summary</Card.Title>
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
                    <span>Food Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <Alert variant="info" className="mt-2 small">
                    Payment for food will be collected at the restaurant
                  </Alert>
                </Card.Body>
              </Card>
            )}

            {/* Reservation Summary */}
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">Reservation Summary</Card.Title>
              </Card.Header>
              <Card.Body>
                <p><strong>Restaurant:</strong> {restaurant.name}</p>
                <p><strong>Date:</strong> {date || '-'}</p>
                <p><strong>Time:</strong> {time || '-'}</p>
                <p><strong>Guests:</strong> {pax}</p>
                <p><strong>Table:</strong> #{table.id} ({table.seats} seats)</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
