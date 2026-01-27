// Reservation.jsx - Complete Reservation Flow with Visual Table Selection
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { Container, Form, Button, Card, Row, Col, Modal, Spinner, Alert } from "react-bootstrap";
import Navbar from "../components/Navbar";
import { formatPrice } from "../utils/formatters";
import { useToast, ToastProvider } from "../components/Toast";
import { AppContext } from "../context/AppContext";
import { reservationAPI, authAPI, restaurantAPI } from "../services/api";
import { auth } from "../firebase";

import sushiImg from "../assets/restaurants/sushi.png";
import pastaImg from "../assets/restaurants/pasta.png";
import indianImg from "../assets/restaurants/indian.png";

const getRestaurantImage = (restaurant) => {
  if (restaurant.image_url) return restaurant.image_url;
  const name = (restaurant.name || '').toLowerCase();
  if (name.includes('sushi') || name.includes('japanese')) return sushiImg;
  if (name.includes('pasta') || name.includes('italian')) return pastaImg;
  if (name.includes('indian') || name.includes('spice')) return indianImg;
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80';
};

export default function Reservation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurant: initialRestaurant, cart = [], table: initialTable } = location.state || {};
  const { showToast, removeToast, toasts } = useToast();
  const { clearCart } = useContext(AppContext);

  // State
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(initialRestaurant || null);
  const [selectedTable, setSelectedTable] = useState(initialTable || null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pax, setPax] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [seatNumber, setSeatNumber] = useState(initialTable?.seatNumber || "");
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bookedTables, setBookedTables] = useState([]); // Tables already booked for selected date/time

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const data = await restaurantAPI.getAll();
        setRestaurants(data || []);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

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

  // Fetch booked tables when date, time, or restaurant changes
  useEffect(() => {
    const fetchBookedTables = async () => {
      if (!selectedRestaurant || !date || !time) {
        console.log('🚫 没有餐厅/日期/时间，跳过检查');
        setBookedTables([]);
        return;
      }

      console.log('🔍 检查已预订桌子:', {
        restaurant_id: selectedRestaurant.id,
        date: date,
        time: time
      });

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const url = `${apiUrl}/api/reservations/check?restaurant_id=${selectedRestaurant.id}&date=${date}&time=${time}`;
        console.log('📡 调用 API:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        console.log('📬 API 响应状态:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ 已预订的桌子ID:', data.booked_table_ids);
          setBookedTables(data.booked_table_ids || []);
        } else {
          console.warn('⚠️ API 返回错误状态:', response.status);
          setBookedTables([]);
        }
      } catch (error) {
        console.error('❌ 获取已预订桌子失败:', error);
        setBookedTables([]);
      }
    };

    fetchBookedTables();
  }, [selectedRestaurant, date, time]);

  // Get tables for selected restaurant
  const getTablesForRestaurant = (restaurantId) => {
    return [
      { id: 1, name: "Table 1", seats: 4, seatNumber: "A1" },
      { id: 2, name: "Table 2", seats: 4, seatNumber: "A2" },
      { id: 3, name: "Table 3", seats: 2, seatNumber: "B1" },
      { id: 4, name: "Table 4", seats: 6, seatNumber: "B2" },
      { id: 5, name: "Table 5", seats: 8, seatNumber: "C1" },
      { id: 6, name: "Table 6", seats: 2, seatNumber: "C2" },
    ];
  };

  const tables = selectedRestaurant ? getTablesForRestaurant(selectedRestaurant.id) : [];
  const isTableDisabled = (table) => {
    // Disable if party size exceeds table capacity
    if (pax > table.seats) return true;
    // Disable if table is already booked for this date/time
    if (bookedTables.includes(table.id)) return true;
    return false;
  };

  // Calculate subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasOrder = cart.length > 0;

  // Validation
  const isFormValid = date && time && selectedRestaurant && selectedTable && seatNumber;

  const handleConfirmShow = () => {
    if (!isFormValid) {
      showToast("Please fill in all required fields and select a table", "warning");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);

    try {
      // Ensure we have a valid token
      let token = localStorage.getItem('token');
      if (!token && auth.currentUser) {
        try {
          const loginResult = await authAPI.login(auth.currentUser.email);
          if (loginResult.token) {
            localStorage.setItem('token', loginResult.token);
          }
        } catch (e) {
          // Continue anyway
        }
      }

      const reservationData = {
        restaurant_id: selectedRestaurant.id,
        table_id: selectedTable.id,
        reservation_date: date,
        reservation_time: time,
        party_size: parseInt(pax),
        special_requests: specialRequests || null,
        customer_name: profile?.first_name + ' ' + profile?.last_name || '',
        customer_phone: profile?.phone || '',
        customer_email: profile?.email || auth.currentUser?.email || ''
      };

      const result = await reservationAPI.create(reservationData);

      // Create a properly formatted reservation object for payment page
      const formattedReservation = {
        ...result.reservation,
        restaurant_name: selectedRestaurant.name,
        restaurant: selectedRestaurant.name,
        table: selectedTable.name,
        partySize: parseInt(pax)
      };

      if (subtotal === 0) {
        // No food order, go directly to confirmation
        showToast("Reservation created successfully!", "success");
        navigate("/order-confirmation", {
          state: {
            order: null,
            reservation: formattedReservation,
            message: "Your table reservation has been confirmed!"
          }
        });
      } else {
        // Has food order, go to payment
        navigate("/payment-method", {
          state: {
            reservation: formattedReservation,
            cart,
            restaurant: selectedRestaurant,
            customer: profile
          }
        });
      }
    } catch (error) {
      console.error('Reservation error:', error);
      const errorMessage = error.message || "Failed to create reservation";
      
      // Check if it's a table booking conflict error
      if (errorMessage.includes('already booked') || errorMessage.includes('table is already booked')) {
        showToast("⚠️ This table is already booked for the selected time. Please choose a different time or table.", "error");
      } else {
        showToast(errorMessage, "error");
      }
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/home");
  };

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <>
        <Navbar />
        <ToastProvider toasts={toasts} removeToast={removeToast} />
        <Container className="my-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading...</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastProvider toasts={toasts} removeToast={removeToast} />
      <Container className="my-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Table Reservation</h3>
          <Button variant="outline-secondary" size="sm" onClick={handleBackToHome}>
            ← Back to Home
          </Button>
        </div>

        <Row>
          <Col md={8}>
            {/* Restaurant Selection */}
            {!selectedRestaurant ? (
              <>
                <h4 className="mb-3">Select Restaurant</h4>
                <Row xs={1} sm={2} md={3} className="g-3 mb-4">
                  {restaurants.map((r) => (
                    <Col key={r.id}>
                      <Card
                        style={{
                          cursor: "pointer",
                          transition: "all 0.3s",
                        }}
                        onClick={() => {
                          setSelectedRestaurant(r);
                          setSelectedTable(null);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <div
                          style={{
                            background: `url('${getRestaurantImage(r)}') center/cover no-repeat`,
                            height: "120px",
                            borderTopLeftRadius: "8px",
                            borderTopRightRadius: "8px",
                          }}
                        />
                        <Card.Body className="p-2">
                          <Card.Title className="mb-0" style={{ fontSize: "1rem" }}>
                            {r.name}
                          </Card.Title>
                          <Card.Text className="text-muted small mb-0">
                            {r.cuisine_type}
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            ) : (
              <>
                {/* Selected Restaurant Info */}
                <Card className="mb-4" style={{ border: "2px solid #FF7E5F" }}>
                  <Card.Body className="d-flex align-items-center">
                    <div
                      style={{
                        background: `url('${getRestaurantImage(selectedRestaurant)}') center/cover no-repeat`,
                        width: "60px",
                        height: "60px",
                        borderRadius: "8px",
                        marginRight: "15px",
                      }}
                    />
                    <div>
                      <h5 className="mb-1">{selectedRestaurant.name}</h5>
                      <p className="text-muted small mb-0">
                        {selectedRestaurant.cuisine_type} • {selectedRestaurant.address?.split(',')[0]}
                      </p>
                    </div>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="ms-auto"
                      onClick={() => {
                        setSelectedRestaurant(null);
                        setSelectedTable(null);
                      }}
                    >
                      Change
                    </Button>
                  </Card.Body>
                </Card>

                {/* Date/Time/Pax Input */}
                <Card className="mb-4">
                  <Card.Body>
                    <h5 className="mb-3">Reservation Details</h5>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="date"
                            min={today}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Time <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Guests</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            max="20"
                            value={pax}
                            onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Visual Table Selection */}
                <h4 className="mb-3">Select Table at {selectedRestaurant.name}</h4>
                <p className="text-muted mb-3">
                  Party Size: <strong>{pax}</strong> guests - Tables with fewer seats are disabled
                </p>
                
                {/* Debug info - will be removed later */}
                <Alert variant="info" className="mb-3" style={{ fontSize: '0.85rem' }}>
                  <strong>Debug Info:</strong> Booked tables: {bookedTables.length > 0 ? bookedTables.join(', ') || 'none' : 'loading...'}
                </Alert>

                <div style={{
                  display: "flex",
                  gap: "2rem",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  marginTop: "2rem",
                  marginBottom: "2rem"
                }}>
                  {tables.map((table) => {
                    const isDisabled = isTableDisabled(table);
                    const isSelected = selectedTable?.id === table.id;
                    const isBooked = bookedTables.includes(table.id);
                    const isTooSmall = pax > table.seats;

                    return (
                      <div
                        key={table.id}
                        onClick={() => {
                          if (!isDisabled) {
                            setSelectedTable(table);
                            setSeatNumber(table.seatNumber);
                          }
                        }}
                        style={{
                          width: "220px",
                          height: "220px",
                          borderRadius: "20px",
                          background: isDisabled
                            ? isBooked
                              ? "linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)" // Red for booked
                              : "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)" // Gray for too small
                            : isSelected
                              ? "linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)"
                              : "linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          position: "relative",
                          transition: "all 0.3s ease",
                          opacity: isDisabled ? 0.7 : 1,
                          border: isDisabled
                            ? isBooked
                              ? "3px dashed #d32f2f" // Red dashed border for booked
                              : "2px dashed #999"
                            : "2px solid #ddd",
                          outline: isSelected ? "3px solid #FF6B4A" : "none",
                          outlineOffset: "-2px",
                          boxShadow: isSelected
                            ? "0 8px 20px rgba(255, 126, 95, 0.4)"
                            : "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                        onMouseEnter={(e) => {
                          if (!isDisabled && !isSelected) {
                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.boxShadow = isDisabled ? "none" : "0 4px 12px rgba(0,0,0,0.1)";
                          }
                        }}
                      >
                        {/* Table Top */}
                        <div
                          style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "50%",
                            background: isDisabled
                              ? "linear-gradient(135deg, #c5c5c5 0%, #a0a0a0 100%)"
                              : isSelected
                                ? "linear-gradient(135deg, #fff 0%, #f8f8f8 100%)"
                                : "linear-gradient(135deg, #fff 0%, #f5f5f5 100%)",
                            border: isSelected ? "3px solid #FF7E5F" : "2px solid #ddd",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                            boxShadow: isSelected
                              ? "inset 0 2px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)"
                              : "inset 0 2px 6px rgba(0,0,0,0.08)",
                            zIndex: 2,
                          }}
                        >
                          <div style={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            color: isSelected ? "#FF7E5F" : isDisabled ? "#666" : "#333",
                            marginBottom: "2px",
                            zIndex: 3
                          }}>
                            {table.name}
                          </div>
                          <div style={{
                            fontSize: "0.65rem",
                            color: isDisabled ? "#999" : "#666",
                            zIndex: 3
                          }}>
                            {table.seatNumber}
                          </div>
                        </div>

                        {/* Table Info */}
                        <div style={{
                          marginTop: "8px",
                          textAlign: "center",
                          zIndex: 3,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "3px"
                        }}>
                          <div style={{
                            fontSize: "0.75rem",
                            color: isDisabled ? "#999" : "#666",
                            fontWeight: "500"
                          }}>
                            {table.seats} seats
                          </div>
                          {isBooked && (
                            <div style={{
                              fontSize: "0.65rem",
                              color: "#d32f2f",
                              fontWeight: "bold",
                            }}>
                              Booked
                            </div>
                          )}
                          {isTooSmall && !isBooked && (
                            <div style={{
                              fontSize: "0.65rem",
                              color: "#999",
                              fontWeight: "bold",
                            }}>
                              Too Small
                            </div>
                          )}
                        </div>

                        {/* Chair Icons */}
                        {Array.from({ length: Math.min(table.seats, 8) }).map((_, idx) => {
                          const angle = (360 / Math.min(table.seats, 8)) * idx - 90;
                          const rad = (angle * Math.PI) / 180;
                          const centerX = 110;
                          const centerY = 110;
                          const radius = 85;
                          const iconSize = 18;

                          return (
                            <div
                              key={idx}
                              style={{
                                position: "absolute",
                                top: `${centerY - iconSize / 2 + radius * Math.sin(rad)}px`,
                                left: `${centerX - iconSize / 2 + radius * Math.cos(rad)}px`,
                                width: `${iconSize}px`,
                                height: `${iconSize}px`,
                                borderRadius: "50%",
                                background: isDisabled ? "#bbb" : isSelected ? "#fff" : "#4CAF50",
                                border: isSelected ? "2px solid #FF7E5F" : "2px solid #fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: isSelected ? "0 2px 6px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.2)",
                                zIndex: 1,
                                transition: "all 0.3s ease",
                              }}
                            >
                              <i
                                className="bi bi-person-fill"
                                style={{
                                  fontSize: `${iconSize - 6}px`,
                                  color: isSelected ? "#FF7E5F" : "#fff",
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Seat Number Input */}
                <Card>
                  <Card.Body>
                    <h5 className="mb-3">Confirm Your Seat</h5>

                    <Form.Group className="mb-3">
                      <Form.Label>Seat Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={seatNumber}
                        onChange={(e) => setSeatNumber(e.target.value)}
                        placeholder="e.g., A1, B2"
                        required
                        disabled={!!selectedTable?.seatNumber}
                      />
                      {selectedTable?.seatNumber && (
                        <Form.Text className="text-muted">Seat number is locked for this table</Form.Text>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Special Requests (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Any special requests?"
                      />
                    </Form.Group>

                    <div className="d-flex gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedRestaurant(null);
                          setSelectedTable(null);
                        }}
                      >
                        ← Change Restaurant
                      </Button>
                      <Button
                        onClick={handleConfirmShow}
                        disabled={!isFormValid}
                        style={{
                          background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
                          border: "none",
                        }}
                      >
                        {hasOrder ? "Continue to Payment" : "Confirm Reservation"}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </>
            )}
          </Col>

          <Col md={4}>
            {/* Cart Summary */}
            {hasOrder && (
              <Card className="mb-4">
                <Card.Header>
                  <Card.Title className="mb-0">Food Order</Card.Title>
                </Card.Header>
                <Card.Body>
                  {cart.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between mb-2">
                      <span>{item.name} x {item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <hr />
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <Alert variant="info" className="mt-2 small">
                    Payment at restaurant
                  </Alert>
                </Card.Body>
              </Card>
            )}

            {/* Selected Table Info */}
            {selectedTable && (
              <Card className="mb-4">
                <Card.Header>
                  <Card.Title className="mb-0">Selected Table</Card.Title>
                </Card.Header>
                <Card.Body>
                  <p><strong>Table:</strong> {selectedTable.name}</p>
                  <p><strong>Seats:</strong> {selectedTable.seats}</p>
                  <p><strong>Seat Number:</strong> {selectedTable.seatNumber}</p>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Confirmation Modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Reservation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            Please review your reservation details.
          </Alert>

          <Card className="mb-3">
            <Card.Body>
              <h5 className="fw-bold mb-3">{selectedRestaurant?.name}</h5>

              <p className="mb-2">
                <i className="bi bi-calendar-event me-2"></i>
                <strong>Date:</strong> {date}
              </p>
              <p className="mb-2">
                <i className="bi bi-clock me-2"></i>
                <strong>Time:</strong> {time}
              </p>
              <p className="mb-2">
                <i className="bi bi-people me-2"></i>
                <strong>Party Size:</strong> {pax} guests
              </p>
              <p className="mb-2">
                <i className="bi bi-grid me-2"></i>
                <strong>Table:</strong> {selectedTable?.name} ({selectedTable?.seats} seats)
              </p>
              <p className="mb-0">
                <i className="bi bi-geo-alt me-2"></i>
                <strong>Seat:</strong> {seatNumber}
              </p>

              {specialRequests && (
                <div className="mt-3 p-2 bg-light rounded">
                  <strong>Special Requests:</strong><br />
                  {specialRequests}
                </div>
              )}
            </Card.Body>
          </Card>

          {hasOrder && (
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">Food Order</Card.Title>
              </Card.Header>
              <Card.Body>
                {cart.map((item, idx) => (
                  <div key={idx} className="d-flex justify-content-between mb-2">
                    <span>{item.name} x {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </Card.Body>
            </Card>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            disabled={submitting}
            style={{
              background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
              border: "none",
            }}
          >
            {submitting ? "Creating..." : "Confirm"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
