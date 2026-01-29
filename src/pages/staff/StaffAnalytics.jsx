// StaffAnalytics.jsx - Analytics for Manager
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { staffAPI } from "../../services/api";

export default function StaffAnalytics() {
  const navigate = useNavigate();
  const { isManager, userRole, clearRole } = useContext(RoleContext);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Real data states
  const [stats, setStats] = useState(null);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  // Redirect if not manager
  useEffect(() => {
    if (userRole && !isManager) {
      navigate("/staff/dashboard");
    }
  }, [isManager, userRole, navigate]);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get stats from staff API
      const statsData = await staffAPI.getStats();
      setStats(statsData);
      
      // Get reservations for recent data
      const reservationsData = await staffAPI.getReservations();
      setRecentReservations(reservationsData.slice(0, 10));
      
      // Get orders for recent data
      const ordersData = await staffAPI.getOrders();
      setRecentOrders(ordersData.slice(0, 10));
      
      // For top restaurants and peak hours, we'll use the reservation data
      // Group by restaurant
      const restaurantStats = {};
      reservationsData.forEach(r => {
        const name = r.restaurant_name || 'Unknown';
        if (!restaurantStats[name]) {
          restaurantStats[name] = { name, count: 0 };
        }
        restaurantStats[name].count++;
      });
      setTopRestaurants(Object.values(restaurantStats).sort((a, b) => b.count - a.count));
      
      // Group by hour
      const hourStats = {};
      reservationsData.forEach(r => {
        if (r.reservation_time) {
          const hour = r.reservation_time.split(':')[0];
          if (!hourStats[hour]) {
            hourStats[hour] = 0;
          }
          hourStats[hour]++;
        }
      });
      const hours = Object.entries(hourStats)
        .map(([hour, count]) => ({ hour, reservation_count: count }))
        .sort((a, b) => parseInt(b.hour) - parseInt(a.hour));
      setPeakHours(hours);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      if (err.message?.includes('token') || err.message?.includes('auth')) {
        clearRole();
        navigate("/staff/login");
      } else {
        setError(err.message || "Failed to load analytics data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'success',
      preparing: 'primary',
      ready: 'success',
      completed: 'secondary',
      cancelled: 'danger'
    };
    return <span className={`badge bg-${variants[status] || 'secondary'}`}>{status}</span>;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading analytics...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>📊 Analytics Dashboard</h2>
          <p className="text-muted mb-0">
            {isManager ? 'Manager View' : 'Staff View'} • Real-time data from database
          </p>
        </div>
        <div className="d-flex gap-2">
          <Form.Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ width: "auto" }}
            disabled
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </Form.Select>
          <Button variant="outline-primary" onClick={fetchAnalytics}>
            🔄 Refresh
          </Button>
          <Button variant="secondary" onClick={() => navigate("/staff/dashboard")}>
            ← Back
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Key Metrics - Today's Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Today's Reservations</Card.Title>
              <Card.Text className="display-4 fw-bold">{stats?.todayReservations || 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Pending Orders</Card.Title>
              <Card.Text className="display-4 fw-bold">{stats?.pendingOrders || 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Completed Orders</Card.Title>
              <Card.Text className="display-4 fw-bold">{stats?.completedOrders || 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Today's Revenue</Card.Title>
              <Card.Text className="display-4 fw-bold">{formatCurrency(stats?.totalRevenue)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Top Restaurants */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">🏆 Restaurant Performance</Card.Title>
            </Card.Header>
            <Card.Body>
              {topRestaurants.length === 0 ? (
                <p className="text-muted text-center">No reservation data available</p>
              ) : (
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Restaurant</th>
                      <th>Reservations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRestaurants.map((r, idx) => (
                      <tr key={idx}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Peak Hours */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">⏰ Reservation Hours</Card.Title>
            </Card.Header>
            <Card.Body>
              {peakHours.length === 0 ? (
                <p className="text-muted text-center">No time data available</p>
              ) : (
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Reservations</th>
                      <th>Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peakHours.map((h, idx) => {
                      const hour = parseInt(h.hour);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const hour12 = hour % 12 || 12;
                      const maxCount = Math.max(...peakHours.map(p => parseInt(p.reservation_count || 0)));
                      const percentage = maxCount > 0 ? ((parseInt(h.reservation_count) / maxCount) * 100) : 0;
                      
                      return (
                        <tr key={idx}>
                          <td><strong>{hour12}:00 {ampm}</strong></td>
                          <td>{h.reservation_count}</td>
                          <td>
                            <div className="progress" style={{ height: '8px' }}>
                              <div 
                                className="progress-bar bg-primary" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Reservations & Orders */}
      <Row>
        <Col md={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">📅 Recent Reservations</Card.Title>
              <Button variant="link" size="sm" onClick={() => navigate("/staff/reservations")}>
                View All →
              </Button>
            </Card.Header>
            <Card.Body>
              {recentReservations.length === 0 ? (
                <p className="text-muted text-center">No reservations found</p>
              ) : (
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Date/Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReservations.map((r) => (
                      <tr key={r.id}>
                        <td>{r.customer_name || 'Unknown'}</td>
                        <td>
                          <small>{formatDate(r.reservation_date)}</small><br />
                          <small className="text-muted">{formatTime(r.reservation_time)}</small>
                        </td>
                        <td>{getStatusBadge(r.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">🛒 Recent Orders</Card.Title>
              <Button variant="link" size="sm" onClick={() => navigate("/staff/orders")}>
                View All →
              </Button>
            </Card.Header>
            <Card.Body>
              {recentOrders.length === 0 ? (
                <p className="text-muted text-center">No orders found</p>
              ) : (
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.customer_email || 'Unknown'}</td>
                        <td>{formatCurrency(o.total_amount)}</td>
                        <td>{getStatusBadge(o.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
