// StaffDashboard.jsx
import React, { useContext } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";

// Restaurant list (should match with AdminStaff)
const restaurants = [
  { id: 1, name: "Sushi Hana" },
  { id: 2, name: "La Pasta" },
  { id: 3, name: "Spice Route" },
  { id: 4, name: "168 Ban Mian" },
];

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { userRole, isManager, clearRole, userRestaurantId } = useContext(RoleContext);

  // Get restaurant name from ID
  const restaurantName = userRestaurantId 
    ? restaurants.find(r => r.id === userRestaurantId)?.name || "Unknown Restaurant"
    : "No Restaurant Assigned";

  // Staff can only view bookings/reservations, not orders or analytics
  // Filter reservations by restaurant if userRestaurantId is set
  const allReservations = [
    { id: 1, customer: "Alice", restaurant: "Sushi Hana", restaurantId: 1, date: "2025-12-22", time: "18:00", partySize: 4, seatNumber: "A1", status: "Confirmed" },
    { id: 2, customer: "Bob", restaurant: "La Pasta", restaurantId: 2, date: "2025-12-22", time: "19:00", partySize: 2, seatNumber: "B1", status: "Pending" },
    { id: 3, customer: "Charlie", restaurant: "Sushi Hana", restaurantId: 1, date: "2025-12-22", time: "20:00", partySize: 6, seatNumber: "B2", status: "Confirmed" },
  ];

  // Filter reservations by restaurant if userRestaurantId is set
  const todayReservations = userRestaurantId
    ? allReservations.filter(r => r.restaurantId === userRestaurantId)
    : allReservations;

  const statusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <Badge bg="warning">{status}</Badge>;
      case "Confirmed":
        return <Badge bg="success">{status}</Badge>;
      case "Completed":
        return <Badge bg="secondary">{status}</Badge>;
      default:
        return <Badge bg="light">{status}</Badge>;
    }
  };

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-2">
            {isManager ? "Manager Dashboard" : "Staff Dashboard"}
          </h2>
          <div className="d-flex align-items-center gap-2">
            <p className="text-muted mb-0">
              Restaurant: <Badge bg="primary">{restaurantName}</Badge>
            </p>
            <p className="text-muted mb-0">
              Role: <Badge bg={isManager ? "success" : "info"}>{userRole}</Badge>
            </p>
          </div>
        </div>
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={() => {
            clearRole();
            navigate("/staff/login");
          }}
        >
          Logout
        </Button>
      </div>
      
      {isManager && (
        <div className="alert alert-info mb-4">
          <strong>Manager Access:</strong> You can view analytics and manage all bookings.
          <Button 
            variant="link" 
            className="p-0 ms-2" 
            onClick={() => navigate("/admin/analytics")}
          >
            View Analytics →
          </Button>
        </div>
      )}
      
      <p className="text-muted mb-4">
        {isManager 
          ? "You can view analytics and manage bookings/reservations." 
          : "You can only view and manage bookings/reservations for your restaurant."}
      </p>

      <Row className="g-4">
        {/* Reservations Summary Card */}
        <Col md={6}>
          <Card className="shadow-sm p-3">
            <Card.Title>
              Today's Reservations
              {userRestaurantId && (
                <small className="text-muted d-block mt-1">for {restaurantName}</small>
              )}
            </Card.Title>
            <Card.Text className="display-6">{todayReservations.length}</Card.Text>
            <Button variant="primary" className="w-100 mb-2" onClick={() => navigate("/staff/reservations")}>
              Manage Reservations
            </Button>
            <ListGroup variant="flush">
              {todayReservations.map((r) => (
                <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <div><strong>{r.customer}</strong></div>
                    <small className="text-muted">{r.restaurant} • {r.partySize} people • Seat {r.seatNumber}</small>
                  </div>
                  {statusBadge(r.status)}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        {/* Quick Actions Card */}
        <Col md={6}>
          <Card className="shadow-sm p-3">
            <Card.Title>Quick Actions</Card.Title>
            <Button variant="info" className="w-100 mb-2" onClick={() => navigate("/staff/reservations")}>
              View All Reservations
            </Button>
            <Card.Text className="text-muted mt-3">
              <small>
                Note: Staff members can only view and manage bookings/reservations. 
                Analytics and order management are restricted to managers.
              </small>
            </Card.Text>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
