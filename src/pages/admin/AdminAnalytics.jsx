// AdminAnalytics.jsx
import React, { useState, useContext } from "react";
import { Container, Row, Col, Card, Table, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { isManager, userRole, clearRole } = useContext(RoleContext);

  // Redirect if not manager
  React.useEffect(() => {
    if (userRole && !isManager) {
      navigate("/staff/dashboard");
    }
  }, [isManager, userRole, navigate]);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Mock analytics data (should be from database in production)
  const analyticsData = {
    totalReservations: 156,
    totalOrders: 234,
    totalRevenue: 45678.90,
    averageOrderValue: 195.21,
    topRestaurants: [
      { id: 1, name: "Sushi Hana", reservations: 45, revenue: 12345.67 },
      { id: 2, name: "La Pasta", reservations: 38, revenue: 9876.54 },
      { id: 3, name: "Spice Route", reservations: 35, revenue: 8765.43 },
      { id: 4, name: "168 Ban Mian", reservations: 38, revenue: 14791.26 },
    ],
    recentReservations: [
      { id: 1, customer: "Alice", restaurant: "Sushi Hana", date: "2025-12-22", time: "18:00", partySize: 4, seatNumber: "A1" },
      { id: 2, customer: "Bob", restaurant: "La Pasta", date: "2025-12-22", time: "19:00", partySize: 2, seatNumber: "B1" },
      { id: 3, customer: "Charlie", restaurant: "Sushi Hana", date: "2025-12-22", time: "20:00", partySize: 6, seatNumber: "B2" },
    ],
    peakHours: [
      { hour: "12:00", reservations: 15 },
      { hour: "13:00", reservations: 18 },
      { hour: "18:00", reservations: 25 },
      { hour: "19:00", reservations: 22 },
      { hour: "20:00", reservations: 20 },
    ],
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Analytics Dashboard</h2>
        <div className="d-flex gap-2">
          <Form.Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ width: "auto" }}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </Form.Select>
          <Button variant="secondary" onClick={() => navigate("/admin/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title className="text-muted small">Total Reservations</Card.Title>
              <Card.Text className="display-4 text-primary">{analyticsData.totalReservations}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title className="text-muted small">Total Orders</Card.Title>
              <Card.Text className="display-4 text-success">{analyticsData.totalOrders}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title className="text-muted small">Total Revenue</Card.Title>
              <Card.Text className="display-4 text-info">RM {analyticsData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <Card.Title className="text-muted small">Avg Order Value</Card.Title>
              <Card.Text className="display-4 text-warning">RM {analyticsData.averageOrderValue.toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Top Restaurants */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header>
              <Card.Title className="mb-0">Top Restaurants by Reservations</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Restaurant</th>
                    <th>Reservations</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topRestaurants.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.reservations}</td>
                      <td>RM {r.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Peak Hours */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header>
              <Card.Title className="mb-0">Peak Hours</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Hour</th>
                    <th>Reservations</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.peakHours.map((h, idx) => (
                    <tr key={idx}>
                      <td><strong>{h.hour}</strong></td>
                      <td>{h.reservations}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Reservations */}
      <Row>
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header>
              <Card.Title className="mb-0">Recent Reservations</Card.Title>
            </Card.Header>
            <Card.Body>
              <Table striped hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Restaurant</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Party Size</th>
                    <th>Seat Number</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.recentReservations.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.customer}</td>
                      <td>{r.restaurant}</td>
                      <td>{r.date}</td>
                      <td>{r.time}</td>
                      <td>{r.partySize}</td>
                      <td>{r.seatNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}


