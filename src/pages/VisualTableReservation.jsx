// VisualTableReservation.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Form, Button, Row, Col, Card } from "react-bootstrap";
import Navbar from "../components/Navbar";
import { useToast, ToastProvider } from "../components/Toast";

// Import restaurants list (should be from database in production)
import sushiImg from "../assets/restaurants/sushi.png";
import pastaImg from "../assets/restaurants/pasta.png";
import indianImg from "../assets/restaurants/indian.png";

const restaurants = [
  {
    id: 1,
    name: "Sushi Hana",
    cuisine: "Japanese",
    location: "KL",
    image: sushiImg,
  },
  {
    id: 2,
    name: "La Pasta",
    cuisine: "Italian",
    location: "PJ",
    image: pastaImg,
  },
  {
    id: 3,
    name: "Spice Route",
    cuisine: "Indian",
    location: "Subang Jaya",
    image: indianImg,
  },
  {
    id: 4,
    name: "168 Ban Mian",
    cuisine: "Chinese",
    location: "Kepong",
    image: 'https://lh3.googleusercontent.com/gps-cs-s/AG0ilSxPgdA97GBJgiopGu5o1yzgtJbJsLMGOOeKvhJK0FJ-ydO7ZWbYn2wPwEC3M4Q6N_ciIyBa8Adsgho2_1gS1zOe9sQW8qFxh4usb2YgfdewPS0dzR18uB-hv60Q9AE8W7RTtHTC=s1360-w1360-h1020-rw',
  },
];

export default function VisualTableReservation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurant: initialRestaurant, cart = [] } = location.state || {};
  const { showToast, removeToast, toasts } = useToast();

  // Step management: 1 = Personal Info, 2 = Restaurant & Table Selection
  const [step, setStep] = useState(1);
  
  // Personal Information
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [pax, setPax] = useState(1);

  const [selectedRestaurant, setSelectedRestaurant] = useState(initialRestaurant || null);
  const [selectedTable, setSelectedTable] = useState(null);

  // Tables should be fetched based on selected restaurant
  const getTablesForRestaurant = (restaurantId) => {
    // In production, fetch from database
    return [
      { id: 1, name: "Table 1", seats: 4, seatNumber: "A1" },
      { id: 2, name: "Table 2", seats: 4, seatNumber: "A2" },
      { id: 3, name: "Table 3", seats: 2, seatNumber: "B1" },
      { id: 4, name: "Table 4", seats: 6, seatNumber: "B2" },
      { id: 5, name: "Table 5", seats: 2, seatNumber: "C1" },
    ];
  };

  const tables = selectedRestaurant ? getTablesForRestaurant(selectedRestaurant.id) : [];

  // Check if table is suitable for the pax (disable if pax > table seats)
  const isTableDisabled = (table) => {
    return pax > table.seats;
  };

  // Debug: Log tables when restaurant is selected
  useEffect(() => {
    if (selectedRestaurant) {
      console.log("Selected Restaurant:", selectedRestaurant.name);
      console.log("Tables for restaurant:", tables);
      console.log("Pax:", pax);
      console.log("Tables count:", tables.length);
    }
  }, [selectedRestaurant, tables, pax]);

  const handlePersonalInfoSubmit = (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerEmail || !pax || pax < 1) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }
    setStep(2);
  };

  const handleConfirm = () => {
    if (!selectedRestaurant || !selectedTable) {
      showToast("Please select a restaurant and table.", "warning");
      return;
    }
    navigate("/reservation", { 
      state: { 
        restaurant: selectedRestaurant, 
        cart, 
        table: selectedTable,
        customerInfo: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          pax: pax
        }
      } 
    });
  };

  return (
    <>
      <Navbar />
      <ToastProvider toasts={toasts} removeToast={removeToast} />
      <Container className="my-5">
        <h3 className="text-center mb-4">Visual Table Reservation</h3>

      {/* Step Indicator */}
      <div className="d-flex justify-content-center mb-4">
        <div className="d-flex align-items-center">
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: step >= 1 ? "#FF7E5F" : "#ddd",
              color: step >= 1 ? "#fff" : "#666",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            1
          </div>
          <div
            style={{
              width: "100px",
              height: "3px",
              background: step >= 2 ? "#FF7E5F" : "#ddd",
              margin: "0 10px",
            }}
          />
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: step >= 2 ? "#FF7E5F" : "#ddd",
              color: step >= 2 ? "#fff" : "#666",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            2
          </div>
        </div>
      </div>

      {/* Step 1: Personal Information */}
      {step === 1 && (
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <h4 className="mb-4">Personal Information</h4>
                <Form onSubmit={handlePersonalInfoSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Number of People (Pax) <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="20"
                      value={pax}
                      onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                      required
                    />
                    <Form.Text className="text-muted">
                      Please enter the number of people for this reservation
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex justify-content-between">
                    <Button
                      variant="secondary"
                      onClick={() => navigate("/home")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      style={{
                        background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
                        border: "none",
                      }}
                    >
                      Next: Select Restaurant & Table
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Step 2: Restaurant & Table Selection */}
      {step === 2 && (
        <>
          <div className="mb-3">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setStep(1)}
            >
              ← Back to Personal Info
            </Button>
          </div>

          {/* Restaurant Selection */}
          <Row className="mb-4">
            <Col md={12}>
              <Form.Label className="fw-bold">Select Restaurant</Form.Label>
              <Row xs={1} sm={2} md={4} className="g-3">
                {restaurants.map((r) => (
                  <Col key={r.id}>
                    <Card
                      style={{
                        cursor: "pointer",
                        border: selectedRestaurant?.id === r.id ? "3px solid #FF7E5F" : "1px solid #ddd",
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
                          background: `url('${r.image}') center/cover no-repeat`,
                          height: "120px",
                          borderTopLeftRadius: "8px",
                          borderTopRightRadius: "8px",
                        }}
                      />
                      <Card.Body className="p-2">
                        <Card.Title className="mb-0" style={{ fontSize: "0.9rem" }}>
                          {r.name}
                        </Card.Title>
                        <Card.Text className="text-muted small mb-0">
                          {r.cuisine} • {r.location}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>

          {/* Table Selection */}
          {selectedRestaurant ? (
            <>
              <h5 className="mb-3">Select Table for {selectedRestaurant.name}</h5>
              <p className="text-muted mb-3">
                <strong>Party Size:</strong> {pax} {pax === 1 ? "person" : "people"} - 
                Tables with fewer seats are disabled
              </p>
              {tables.length === 0 ? (
                <div className="alert alert-warning text-center">
                  <p>No tables available for this restaurant.</p>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginTop: "2rem", justifyContent: "center" }}>
                  {tables.map((table) => {
                  const isDisabled = isTableDisabled(table);
                  const isSelected = selectedTable?.id === table.id;
                  
                  return (
                    <div
                      key={table.id}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedTable(table);
                        }
                      }}
                      style={{
                        width: "220px",
                        height: "220px",
                        borderRadius: "20px",
                        background: isDisabled 
                          ? "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)"
                          : isSelected
                            ? "linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)"
                            : "linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        position: "relative",
                        transition: "box-shadow 0.3s ease, background 0.3s ease",
                        opacity: isDisabled ? 0.6 : 1,
                        border: isDisabled 
                          ? "2px dashed #999" 
                          : "2px solid #ddd",
                        outline: isSelected 
                          ? "3px solid #FF6B4A" 
                          : "none",
                        outlineOffset: "-2px",
                        boxShadow: isSelected
                          ? "0 8px 20px rgba(255, 126, 95, 0.4)"
                          : isDisabled
                            ? "none"
                            : "0 4px 12px rgba(0,0,0,0.1)",
                        overflow: "visible",
                        boxSizing: "border-box",
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
                      {/* Table Top - Round Table Surface */}
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
                          border: isSelected
                            ? "3px solid #FF7E5F"
                            : "2px solid #ddd",
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
                      
                      {/* Table Info Below */}
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
                          {table.seats} {table.seats === 1 ? "seat" : "seats"}
                        </div>
                        {isDisabled && (
                          <div style={{ 
                            fontSize: "0.65rem", 
                            color: "#d32f2f", 
                            fontWeight: "bold",
                          }}>
                            ⚠ Too Small
                          </div>
                        )}
                      </div>
                      {/* Chair Icons - Around Table Edge */}
                      {Array.from({ length: table.seats }).map((_, idx) => {
                        // Calculate angle (starting from top, clockwise)
                        const angle = (360 / table.seats) * idx - 90; // -90 to place first chair at top
                        const rad = (angle * Math.PI) / 180;
                        // Table size is 220px, center is 110px, table is 70px (radius 35px), chairs should be outside table
                        const centerX = 110; // 220px / 2
                        const centerY = 110; // 220px / 2
                        const radius = 85; // Distance from center to chair position (table radius 35px + gap)
                        const iconSize = 18; // Icon size
                        
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
                              background: isDisabled
                                ? "#bbb"
                                : isSelected
                                  ? "#fff"
                                  : "#4CAF50",
                              border: isSelected ? "2px solid #FF7E5F" : "2px solid #fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: isSelected
                                ? "0 2px 6px rgba(0,0,0,0.3)"
                                : "0 2px 4px rgba(0,0,0,0.2)",
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
              )}
            </>
          ) : (
            <div className="text-center mt-4">
              <p className="text-muted">Please select a restaurant above to view available tables.</p>
            </div>
          )}

          <div className="text-center mt-4">
        <Button
          style={{
            background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
            border: "none",
            padding: "10px 30px",
          }}
          disabled={!selectedRestaurant || !selectedTable}
          onClick={handleConfirm}
        >
          Confirm Table
        </Button>
            {(!selectedRestaurant || !selectedTable) && (
              <p className="text-muted mt-2 small">
                {!selectedRestaurant ? "Please select a restaurant" : "Please select a table"}
              </p>
            )}
          </div>
        </>
      )}
      </Container>
    </>
  );
}
