// Reservation.jsx - Select restaurant, date/time, and table all in one page
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { Container, Form, Button, Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import Navbar from "../components/Navbar";
import { formatPrice } from "../utils/formatters";
import { useToast, ToastProvider } from "../components/Toast";
import { AppContext } from "../context/AppContext";
import { reservationAPI, authAPI, restaurantAPI } from "../services/api";
import { auth } from "../firebase";

export default function Reservation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useContext(AppContext);

  // Get cart from context or location state
  const { cart = [] } = location.state || {};

  // Restaurant data
  const [restaurant, setRestaurant] = useState(null);
  const [allTables, setAllTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reservation details
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pax, setPax] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);

  const { showToast, removeToast, toasts } = useToast();

  // Get user profile
  useEffect(() => {
    const getProfile = async () => {
      try {
        // First sync user (this creates customer if not exists)
        if (auth.currentUser?.email) {
          try {
            await authAPI.syncUser({
              email: auth.currentUser.email,
              first_name: auth.currentUser.displayName?.split(' ')[0] || '',
              last_name: auth.currentUser.displayName?.split(' ').slice(1).join(' ') || '',
              phone: auth.currentUser.phoneNumber || ''
            });
          } catch (syncError) {
            // Sync might fail if customer already exists, ignore
          }
        }
        
        // Then get profile
        const profileData = await authAPI.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Error getting profile:', error.message);
        // Continue without profile - user can still make reservation
      }
    };
    
    if (auth.currentUser) {
      getProfile();
    }
  }, []);

  // Load restaurant data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get restaurant from URL params or location state
        let restaurantData = location.state?.restaurant;

        if (restaurantData && restaurantData.id && !restaurantData.name) {
          // If restaurant object only has id (from cart), fetch full details
          const restaurants = await restaurantAPI.getAll();
          restaurantData = restaurants.find(r => r.id === parseInt(restaurantData.id));
        }

        if (!restaurantData && !location.state?.restaurant) {
          // Try getting from URL params
          const restaurantId = searchParams.get('restaurant_id');
          if (restaurantId) {
            const restaurants = await restaurantAPI.getAll();
            restaurantData = restaurants.find(r => r.id === parseInt(restaurantId));
          }
        }

        if (!restaurantData) {
          setError('Restaurant not found. Please select a restaurant first.');
          setLoading(false);
          return;
        }

        setRestaurant(restaurantData);

        // Fetch tables
        const tablesData = await restaurantAPI.getFloorPlan(restaurantData.id);
        setAllTables(tablesData || []);
        setAvailableTables(tablesData || []);

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load restaurant data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.state, searchParams]);

  // Update available tables when pax changes (show ALL tables, mark insufficient as disabled)
  useEffect(() => {
    if (allTables.length === 0) {
      setAvailableTables([]);
      return;
    }

    // Show ALL tables - those with matching capacity are selectable
    setAvailableTables(allTables);
    
    // Reset selected table if it's no longer available
    if (selectedTable && selectedTable.capacity !== pax) {
      setSelectedTable(null);
    }
  }, [pax, allTables]);

  const handleSelectTable = (table) => {
    setSelectedTable(table);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !time) {
      showToast("Please select date and time", "warning");
      return;
    }

    if (!selectedTable) {
      showToast("Please select a table", "warning");
      return;
    }

    setSubmitting(true);

    try {
      const reservationData = {
        restaurant_id: restaurant.id,
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

      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (subtotal === 0) {
        showToast("Reservation created successfully!", "success");
        navigate("/order-confirmation", {
          state: {
            order: null,
            reservation: result.reservation,
            message: "Your table reservation has been confirmed!"
          }
        });
      } else {
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

  // Generate time slots
  const timeSlots = [];
  for (let h = 11; h <= 21; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <ToastProvider toasts={toasts} removeToast={removeToast} />
        <Container className="my-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading restaurant details...</p>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <ToastProvider toasts={toasts} removeToast={removeToast} />
        <Container className="my-5 text-center">
          <Alert variant="danger">
            <h4 className="alert-heading">Error</h4>
            <p>{error}</p>
          </Alert>
          <Button
            style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
            onClick={() => navigate("/table-reservation")}
            size="lg"
          >
            Select Restaurant
          </Button>
        </Container>
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <Navbar />
        <ToastProvider toasts={toasts} removeToast={removeToast} />
        <Container className="my-5 text-center">
          <Alert variant="warning">
            <h4 className="alert-heading">Restaurant Not Selected</h4>
            <p>Please select a restaurant to continue.</p>
          </Alert>
          <Button
            style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
            onClick={() => navigate("/table-reservation")}
            size="lg"
          >
            Select Restaurant
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastProvider toasts={toasts} removeToast={removeToast} />
      <Container className="my-5">
        {/* Restaurant Header */}
        <div className="mb-4">
          <h3 className="mb-1">📍 {restaurant.name}</h3>
          <small className="text-muted">{restaurant.cuisine_type} • {restaurant.address}</small>
        </div>

        <Row>
          <Col md={8}>
            {/* Date & Time Selection */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">📅 Select Date & Time</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
              <Form.Group className="mb-3">
                      <Form.Label>📅 Date</Form.Label>
                <Form.Control
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Form.Group>
                  </Col>
                  
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>👥 Guests</Form.Label>
                      <Form.Select
                        value={pax}
                        onChange={(e) => setPax(parseInt(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                          <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={4}>
              <Form.Group className="mb-3">
                      <Form.Label>🕐 Time</Form.Label>
                      <Form.Select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                      >
                        <option value="">Select time</option>
                        {timeSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </Form.Select>
              </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Table Selection */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">🪑 Select Your Table</h5>
              </Card.Header>
              <Card.Body>
                {/* Legend */}
                <div className="mb-4 d-flex justify-content-center gap-4 flex-wrap">
                  <div className="d-flex align-items-center gap-2">
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: 'white',
                      border: '2px solid #e9ecef'
                    }}></div>
                    <small>Available</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)',
                      border: '2px solid #FF7E5F'
                    }}></div>
                    <small>Selected</small>
                  </div>
                </div>

                {/* Check if there are any tables with matching capacity */}
                {allTables.length === 0 ? (
                  <Alert variant="warning">
                    <Alert.Heading>No tables available</Alert.Heading>
                    <p className="mb-0">This restaurant has no tables configured.</p>
                  </Alert>
                ) : allTables.filter(t => t.capacity >= pax).length === 0 ? (
                  <Alert variant="warning">
                    <Alert.Heading>No tables available for {pax} guests</Alert.Heading>
                    <p>There are no tables that can accommodate {pax} guests.</p>
                    <p className="mb-0">Please increase the number of seats or try a different restaurant.</p>
                  </Alert>
                ) : (
                  /* Visual table layout - show ALL tables */
                  <div className="d-flex justify-content-center gap-3 flex-wrap">
                    {availableTables.map(table => (
                      <TableCard 
                        key={table.id} 
                        table={table} 
                        selectedTable={selectedTable}
                        onSelect={handleSelectTable}
                        pax={pax}
                      />
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Special Requests */}
            <Card className="mt-4 border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">📝 Special Requests (Optional)</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Any special requests? (e.g., birthday celebration, dietary restrictions, high chair needed)"
                />
              </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            {/* Summary Card */}
            <Card className="border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
              <Card.Header className="bg-white">
                <h5 className="mb-0">📋 Reservation Summary</h5>
              </Card.Header>
              <Card.Body>
                {/* Restaurant */}
                <div className="mb-3 pb-3 border-bottom">
                  <small className="text-muted">Restaurant</small>
                  <div className="fw-bold">{restaurant.name}</div>
                </div>

                {/* Date & Time */}
                <div className="mb-3 pb-3 border-bottom">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">📅 Date</span>
                    <span className="fw-bold">{date || '-'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">🕐 Time</span>
                    <span className="fw-bold">{time || '-'}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">👥 Guests</span>
                    <span className="fw-bold">{pax}</span>
                  </div>
                </div>

                {/* Selected Table */}
                {selectedTable ? (
                  <div className="mb-3 p-3 rounded" style={{ background: 'rgba(255, 126, 95, 0.1)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold" style={{ color: '#FF7E5F' }}>Selected Table</span>
                      <span className="badge" style={{ background: 'linear-gradient(135deg, #FF7E5F, #FEB47B)' }}>#{selectedTable.id}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>🪑 Table {selectedTable.table_name || selectedTable.id}</span>
                      <span>{selectedTable.capacity} seats</span>
                    </div>
                    {selectedTable.location && (
                      <div className="text-muted small mt-1">📍 {selectedTable.location}</div>
                    )}
                  </div>
                ) : (
                  <div className="mb-3 p-3 bg-warning bg-opacity-10 rounded text-center">
                    <span className="text-warning fw-bold">⚠️ Please select a table</span>
                  </div>
                )}

                {/* Cart Summary */}
                {cart.length > 0 && (
                  <div className="mb-3 pb-3 border-bottom">
                    <small className="text-muted">Food Order</small>
                    <div className="mt-2">
                      {cart.map((item, idx) => (
                        <div key={idx} className="d-flex justify-content-between small">
                          <span>{item.name} x {item.quantity}</span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <hr />
                      <div className="d-flex justify-content-between fw-bold">
                        <span>Subtotal:</span>
                        <span>{formatPrice(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!date || !time || !selectedTable || submitting}
                  onClick={handleSubmit}
                  className="w-100"
                  style={{
                    background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
                    border: "none"
                  }}
                >
                  {submitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Creating...
                    </>
                  ) : (
                    cart.length > 0 ? "Continue to Payment" : "Confirm Reservation"
                  )}
                </Button>

                <Button
                  variant="outline-secondary"
                  className="w-100 mt-2"
                  onClick={() => navigate("/table-reservation")}
                >
                  ← Change Restaurant
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

// Table Selection Card Component - Visual Layout with seats around table
function TableCard({ table, selectedTable, onSelect, pax }) {
  const isSelected = selectedTable?.id === table.id;
  const isNotMatch = table.capacity !== pax;
  
  // Generate seat positions around the circle
  const seatCount = table.capacity || 4;
  const seats = [];
  const radius = 40; // distance from center
  const centerX = 60; // center X position
  const centerY = 60; // center Y position
  
  for (let i = 0; i < seatCount; i++) {
    const angle = (i * (360 / seatCount)) - 90; // Start from top
    const rad = (angle * Math.PI) / 180;
    const x = centerX + radius * Math.cos(rad);
    const y = centerY + radius * Math.sin(rad);
    seats.push({ x, y, angle });
  }

  return (
    <div
      onClick={() => !isNotMatch && onSelect(table)}
      style={{
        width: '130px',
        height: '130px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isNotMatch ? 'not-allowed' : 'pointer',
        background: isSelected 
          ? 'linear-gradient(135deg, #FF7E5F, #FEB47B)' 
          : isNotMatch 
            ? '#f1f3f5' 
            : 'white',
        border: isSelected 
          ? '3px solid #FF7E5F' 
          : isNotMatch 
            ? '2px dashed #dee2e6'
            : '2px solid #e9ecef',
        color: isSelected ? 'white' : isNotMatch ? '#adb5bd' : '#212529',
        transition: 'all 0.2s ease',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isSelected ? '0 4px 15px rgba(255, 126, 95, 0.3)' : 'none',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Seats around the table */}
      {seats.map((seat, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: `${seat.x - 12}px`,
            top: `${seat.y - 12}px`,
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: isSelected ? 'rgba(255,255,255,0.9)' : isNotMatch ? '#dee2e6' : '#FF7E5F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 1,
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ color: isSelected ? '#FF7E5F' : 'white', lineHeight: 1 }}>
            👤
          </span>
        </div>
      ))}

      {/* Center circle with table info */}
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: isSelected ? 'rgba(255,255,255,0.95)' : 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 2
      }}>
        <span style={{ 
          fontSize: '1rem', 
          fontWeight: 'bold',
          color: isSelected ? '#FF7E5F' : '#495057',
          lineHeight: 1
        }}>
          {table.table_name || `T${table.id}`}
        </span>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#FF7E5F',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 4
        }}>
          ✓
        </div>
      )}
    </div>
  );
}
