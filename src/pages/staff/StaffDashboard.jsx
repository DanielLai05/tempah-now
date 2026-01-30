// StaffDashboard.jsx - Staff dashboard
import React, { useContext, useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Badge, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { staffAPI, restaurantAPI } from "../../services/api";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { clearRole, userRestaurantId } = useContext(RoleContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      setRefreshing(true);

      // Fetch restaurants for name lookup
      const restaurantsData = await restaurantAPI.getAll();
      setRestaurants(restaurantsData);

      // Find restaurant name
      if (userRestaurantId) {
        const restaurant = restaurantsData.find(r => r.id === userRestaurantId);
        setRestaurantName(restaurant?.name || "Unknown Restaurant");
      }

      // Fetch reservations (includes orders for each reservation)
      const reservationsData = await staffAPI.getReservations();
      setReservations(reservationsData);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRestaurantId]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Count total orders across all reservations
  const totalOrdersCount = reservations.reduce((sum, r) => sum + (r.orders?.length || 0), 0);
  const pendingOrdersCount = reservations.reduce((sum, r) => {
    return sum + (r.orders?.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length || 0);
  }, 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  const reservationStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'success',
      completed: 'secondary',
      cancelled: 'danger',
      'no-show': 'dark'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="mb-1">Staff Dashboard</h2>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Badge bg="info" className="fs-6">
              STAFF
            </Badge>
            {userRestaurantId && (
              <Badge bg="primary" className="fs-6">
                {restaurantName}
              </Badge>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant={refreshing ? "secondary" : "outline-primary"}
            size="sm"
            onClick={fetchDashboardData}
            disabled={refreshing}
          >
            {refreshing ? 'Loading...' : 'Refresh'}
          </Button>
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
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Last updated time */}
      {lastUpdated && (
        <div className="text-end mb-3">
          <small className="text-muted">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </small>
        </div>
      )}

      {/* Quick Stats */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="text-center shadow-sm h-100 border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <div className="display-4 fw-bold">{reservations.length}</div>
              <div className="small opacity-75">Total Reservations</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm h-100 border-0" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <div className="display-4 fw-bold">{totalOrdersCount}</div>
              <div className="small opacity-75">Food Orders</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm h-100 border-0" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <div className="display-4 fw-bold">{pendingOrdersCount}</div>
              <div className="small opacity-75">Pending Orders</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Reservations */}
        <Col md={12}>
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center bg-white">
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.5rem' }}></span>
                <Card.Title className="mb-0">Reservations & Orders</Card.Title>
                <Badge bg="secondary">{reservations.length}</Badge>
              </div>
              <Button variant="primary" size="sm" onClick={() => navigate("/staff/reservations")}>
                Manage All
              </Button>
            </Card.Header>
            <Card.Body>
              {reservations.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <p className="mb-0">No reservations yet</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {reservations.slice(0, 5).map((r) => (
                    <ListGroup.Item key={r.id} className="d-flex justify-content-between align-items-start py-3">
                      <div className="d-flex gap-3">
                        <div className="text-center" style={{ minWidth: '60px' }}>
                          <div className="fw-bold">{formatDate(r.reservation_date)}</div>
                          <small className="text-muted">{formatTime(r.reservation_time)}</small>
                        </div>
                        <div>
                          <div className="fw-semibold">{r.customer_name || 'Unknown Guest'}</div>
                          <small className="text-muted">
                            {r.party_size} guests
                          </small>
                          {r.orders && r.orders.length > 0 && (
                            <div className="mt-1">
                              <Badge bg="info" className="me-1">
                                {r.orders.length} order(s)
                              </Badge>
                              {r.orders.map(o => (
                                <Badge key={o.id} bg="warning" text="dark" className="me-1" title={`Order #${o.id}: $${o.total_amount}`}>
                                  #{o.id} (${o.total_amount})
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {reservationStatusBadge(r.status)}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
