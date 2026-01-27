// StaffDashboard.jsx
import React, { useContext, useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Badge, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { staffAPI } from "../../services/api";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { userRole, isManager, clearRole, userRestaurantId } = useContext(RoleContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentReservations, setRecentReservations] = useState([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsData = await staffAPI.getStats();
      setStats(statsData);
      
      // Fetch recent reservations
      const reservationsData = await staffAPI.getReservations();
      setRecentReservations(reservationsData.slice(0, 5)); // Take first 5
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userRestaurantId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Pending</Badge>;
      case "confirmed":
        return <Badge bg="success">Confirmed</Badge>;
      case "completed":
        return <Badge bg="secondary">Completed</Badge>;
      case "cancelled":
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="light">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-2">
            {isManager ? "Manager Dashboard" : "Staff Dashboard"}
          </h2>
          <div className="d-flex align-items-center gap-2">
            <p className="text-muted mb-0">
              Role: <Badge bg={isManager ? "success" : "info"}>{userRole}</Badge>
            </p>
          </div>
        </div>
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={() => {
            localStorage.removeItem('staffToken');
            clearRole();
            navigate("/staff/login");
          }}
        >
          Logout
        </Button>
      </div>

      {isManager && (
        <div className="alert alert-info mb-4">
          <strong>Manager Access:</strong> You have full access to manage orders and reservations.
          <Button 
            variant="link" 
            className="p-0 ms-2" 
            onClick={() => navigate("/admin/analytics")}
          >
            View Analytics →
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center">
              <Card.Title className="display-6 text-primary">
                {stats?.todayReservations || 0}
              </Card.Title>
              <Card.Text>Today's Reservations</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm h-100 bg-warning-subtle">
            <Card.Body className="text-center">
              <Card.Title className="display-6 text-warning">
                {stats?.pendingOrders || 0}
              </Card.Title>
              <Card.Text>Pending Orders</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm h-100 bg-success-subtle">
            <Card.Body className="text-center">
              <Card.Title className="display-6 text-success">
                {stats?.completedOrders || 0}
              </Card.Title>
              <Card.Text>Completed Orders</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm h-100">
            <Card.Body className="text-center">
              <Card.Title className="display-6">
                ${(stats?.totalRevenue || 0).toFixed(2)}
              </Card.Title>
              <Card.Text>Today's Revenue</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Recent Reservations */}
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">Recent Reservations</Card.Title>
              <Button variant="link" size="sm" onClick={() => navigate("/staff/reservations")}>
                View All
              </Button>
            </Card.Header>
            <Card.Body>
              {recentReservations.length === 0 ? (
                <p className="text-muted text-center">No reservations yet</p>
              ) : (
                <ListGroup variant="flush">
                  {recentReservations.map((r) => (
                    <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div><strong>{r.customer_name || 'Unknown'}</strong></div>
                        <small className="text-muted">
                          {formatDate(r.reservation_date)} at {formatTime(r.reservation_time)} • {r.party_size} guests
                        </small>
                      </div>
                      {statusBadge(r.status)}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header>
              <Card.Title className="mb-0">Quick Actions</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row className="g-2">
                <Col xs={6}>
                  <Button 
                    variant="primary" 
                    className="w-100 p-3"
                    onClick={() => navigate("/staff/reservations")}
                  >
                    <i className="bi bi-calendar-check me-2"></i>
                    Reservations
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button 
                    variant="info" 
                    className="w-100 p-3"
                    onClick={() => navigate("/staff/orders")}
                  >
                    <i className="bi bi-basket me-2"></i>
                    Orders
                  </Button>
                </Col>
              </Row>
              
              <Card.Text className="text-muted mt-4">
                <small>
                  <strong>Quick Guide:</strong><br />
                  • View and manage reservations<br />
                  • Update order status<br />
                  • Confirm or cancel bookings<br />
                  • Track daily revenue
                </small>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
