// StaffDashboard.jsx - Shared dashboard for STAFF and MANAGER
import React, { useContext, useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Badge, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { staffAPI, restaurantAPI } from "../../services/api";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { userRole, isManager, clearRole, userRestaurantId } = useContext(RoleContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
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

      // Fetch reservations
      const reservationsData = await staffAPI.getReservations();
      setReservations(reservationsData);
      
      // Fetch orders
      const ordersData = await staffAPI.getOrders();
      setOrders(ordersData);

      // For managers, fetch stats (including revenue)
      if (isManager) {
        try {
          const statsData = await staffAPI.getStats();
          setStats(statsData);
        } catch (err) {
          console.error('Error fetching stats:', err);
        }
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRestaurantId, isManager]);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      completed: 'secondary',
      cancelled: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
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
          <h2 className="mb-1">{isManager ? 'Manager Dashboard' : 'Staff Dashboard'}</h2>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Badge bg={isManager ? "warning" : "info"} className="fs-6">
              {isManager ? '👔 MANAGER' : '👤 STAFF'}
            </Badge>
            {userRestaurantId && (
              <Badge bg="primary" className="fs-6">
                🏪 {restaurantName}
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
            {refreshing ? '↻ Loading...' : '🔄 Refresh'}
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
        <Col md={isManager ? 3 : 4}>
          <Card className="text-center shadow-sm h-100 border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <div className="display-4 fw-bold">{reservations.length}</div>
              <div className="small opacity-75">📅 Total Reservations</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={isManager ? 3 : 4}>
          <Card className="text-center shadow-sm h-100 border-0" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <div className="display-4 fw-bold">{orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length}</div>
              <div className="small opacity-75">⏳ Active Orders</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={isManager ? 3 : 4}>
          <Card className="text-center shadow-sm h-100 border-0" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <div className="display-4 fw-bold">{orders.filter(o => o.status === 'completed').length}</div>
              <div className="small opacity-75">✅ Completed Orders</div>
            </Card.Body>
          </Card>
        </Col>
        {/* Revenue - Only for Manager */}
        {isManager && (
          <Col md={3}>
            <Card className="text-center shadow-sm h-100 border-0" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <Card.Body className="text-center">
                <div className="display-4 fw-bold">{formatCurrency(stats?.totalRevenue)}</div>
                <div className="small opacity-75">💰 Today's Revenue</div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <Row className="g-4">
        {/* Reservations */}
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center bg-white">
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.5rem' }}>📅</span>
                <Card.Title className="mb-0">Reservations</Card.Title>
                <Badge bg="secondary">{reservations.length}</Badge>
              </div>
              <Button variant="link" size="sm" onClick={() => navigate("/staff/reservations")}>
                Manage →
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
                            👥 {r.party_size} guests
                          </small>
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

        {/* Orders */}
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center bg-white">
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.5rem' }}>🛒</span>
                <Card.Title className="mb-0">Orders</Card.Title>
                <Badge bg="secondary">{orders.length}</Badge>
              </div>
              <Button variant="link" size="sm" onClick={() => navigate("/staff/orders")}>
                Manage →
              </Button>
            </Card.Header>
            <Card.Body>
              {orders.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <p className="mb-0">No orders yet</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {orders.slice(0, 5).map((o) => (
                    <ListGroup.Item key={o.id} className="d-flex justify-content-between align-items-start py-3">
                      <div className="d-flex gap-3">
                        <div className="text-center" style={{ minWidth: '50px' }}>
                          <div className="fw-bold">#{o.id}</div>
                        </div>
                        <div>
                          <div className="fw-semibold">{o.customer_email || 'Unknown'}</div>
                          <small className="text-muted">
                            📍 {o.restaurant_name}
                          </small>
                        </div>
                      </div>
                      {getStatusBadge(o.status)}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="g-4 mt-2">
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <Card.Title className="mb-0">⚡ Quick Actions</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row className="g-2">
                <Col xs={6} md={3}>
                  <Button 
                    variant="primary" 
                    className="w-100 p-3"
                    onClick={() => navigate("/staff/reservations")}
                  >
                    📅 Manage Reservations
                  </Button>
                </Col>
                <Col xs={6} md={3}>
                  <Button 
                    variant="info" 
                    className="w-100 p-3"
                    onClick={() => navigate("/staff/orders")}
                  >
                    🛒 Manage Orders
                  </Button>
                </Col>
                {isManager && (
                  <Col xs={6} md={3}>
                    <Button 
                      variant="success" 
                      className="w-100 p-3"
                      onClick={() => navigate("/staff/analytics")}
                    >
                      📊 View Analytics
                    </Button>
                  </Col>
                )}
                <Col xs={6} md={isManager ? 3 : 6}>
                  <Button 
                    variant="outline-secondary" 
                    className="w-100 p-3"
                    onClick={() => {
                      localStorage.removeItem('staffToken');
                      clearRole();
                      navigate("/staff/login");
                    }}
                  >
                    🚪 Logout
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
