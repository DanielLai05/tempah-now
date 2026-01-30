// AdminDashboard.jsx
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { adminAPI } from "../../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { clearRole, userRole } = useContext(RoleContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    restaurants: 0,
    reservations: 0,
    staff: 0,
    totalRevenue: 0
  });

  // Redirect if not admin
  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate("/staff/dashboard");
    }
  }, [userRole, navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [restaurants, reservations, staff, analytics] = await Promise.all([
        adminAPI.getAllRestaurants().catch(() => []),
        adminAPI.getAllReservations().catch(() => []),
        adminAPI.getAllStaff().catch(() => []),
        adminAPI.getAnalyticsOverview('month').catch(() => ({}))
      ]);

      setStats({
        restaurants: restaurants.length || 0,
        reservations: reservations.length || 0,
        staff: staff.length || 0,
        totalRevenue: analytics.totalRevenue || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      if (err.message?.includes('token') || err.message?.includes('auth')) {
        handleLogout();
      } else {
        setError(err.message || "Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    clearRole();
    navigate("/admin/login");
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
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
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2>Admin Dashboard</h2>
          <div className="d-flex gap-2 align-items-center">
            <Badge bg="primary" className="fs-6">
              ADMIN
            </Badge>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={fetchStats}>
            Refresh
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Quick Stats */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Restaurants</Card.Title>
              <Card.Text className="display-4 fw-bold">{stats.restaurants}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Reservations</Card.Title>
              <Card.Text className="display-4 fw-bold">{stats.reservations}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Revenue</Card.Title>
              <Card.Text className="display-4 fw-bold">{formatCurrency(stats.totalRevenue)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Management Cards */}
      <Row className="my-4 g-4">
        <Col md={4}>
          <Card className="text-center shadow h-100">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mt-3">Restaurants</Card.Title>
              <p className="text-muted">{stats.restaurants} restaurants registered</p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/admin/restaurants")}
              >
                Manage Restaurants
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow h-100">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mt-3">Reservations</Card.Title>
              <p className="text-muted">{stats.reservations} total reservations</p>
              <Button
                variant="success"
                size="lg"
                onClick={() => navigate("/admin/reservations")}
              >
                View Reservations
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow h-100" style={{ border: '2px solid #007bff' }}>
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mt-3">Analytics</Card.Title>
              <p className="text-muted">View detailed reports</p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/admin/analytics")}
              >
                View Analytics
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="my-4 g-4">
        <Col md={6}>
          <Card className="text-center shadow h-100">
            <Card.Body className="d-flex flex-column justify-content-center">
              <Card.Title className="mt-3">Staff Management</Card.Title>
              <p className="text-muted">{stats.staff} staff members</p>
              <Button
                variant="warning"
                size="lg"
                onClick={() => navigate("/admin/staff")}
              >
                Manage Staff
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
