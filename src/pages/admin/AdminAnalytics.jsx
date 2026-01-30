// AdminAnalytics.jsx
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Table, Form, Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { adminAPI } from "../../services/api";

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { userRole, clearRole } = useContext(RoleContext);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Real data states
  const [overview, setOverview] = useState(null);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);

  // Redirect if not admin
  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate("/staff/dashboard");
    }
  }, [userRole, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    clearRole();
    navigate("/admin/login");
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewData, restaurantsData, hoursData, reservationsData] = await Promise.all([
        adminAPI.getAnalyticsOverview(selectedPeriod),
        adminAPI.getTopRestaurants(selectedPeriod),
        adminAPI.getPeakHours(selectedPeriod),
        adminAPI.getRecentReservations(20)
      ]);

      setOverview(overviewData);
      setTopRestaurants(restaurantsData);
      setPeakHours(hoursData);
      setRecentReservations(reservationsData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      if (err.message?.includes('token') || err.message?.includes('auth')) {
        clearRole();
        navigate("/admin/login");
      } else {
        setError(err.message || "Failed to load analytics data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

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

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'success',
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
          <Button variant="link" onClick={() => navigate("/admin/dashboard")}>
            ← Back to Dashboard
          </Button>
          <h2>Analytics Dashboard</h2>
          <p className="text-muted mb-0">
            Real-time analytics from database
          </p>
        </div>
        <div className="d-flex gap-2">
          <Form.Select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </Form.Select>
          <Button variant="outline-secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Key Metrics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Total Reservations</Card.Title>
              <Card.Text className="display-4 fw-bold">{overview?.totalReservations || 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Total Orders</Card.Title>
              <Card.Text className="display-4 fw-bold">{overview?.totalOrders || 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Total Revenue</Card.Title>
              <Card.Text className="display-4 fw-bold">{formatCurrency(overview?.totalRevenue)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <Card.Body>
              <Card.Title className="small opacity-75">Avg Order Value</Card.Title>
              <Card.Text className="display-4 fw-bold">{formatCurrency(overview?.averageOrderValue)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Top Restaurants */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">🏆 Top Restaurants by Revenue</Card.Title>
              <span className="text-muted">{selectedPeriod}</span>
            </Card.Header>
            <Card.Body>
              {topRestaurants.length === 0 ? (
                <p className="text-muted text-center">No data available</p>
              ) : (
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Restaurant</th>
                      <th>Orders</th>
                      <th>Reservations</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRestaurants.map((r, idx) => (
                      <tr key={r.id || idx}>
                        <td><strong>{r.name}</strong></td>
                        <td>{r.order_count || 0}</td>
                        <td>{r.reservation_count || 0}</td>
                        <td>{formatCurrency(r.revenue)}</td>
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
              <Card.Title className="mb-0">⏰ Peak Hours</Card.Title>
              <span className="text-muted">{selectedPeriod}</span>
            </Card.Header>
            <Card.Body>
              {peakHours.length === 0 ? (
                <p className="text-muted text-center">No data available</p>
              ) : (
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Hour</th>
                      <th>Reservations</th>
                      <th>Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peakHours.map((h, idx) => {
                      const hour = parseInt(h.hour);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const hour12 = hour % 12 || 12;
                      const maxReservations = Math.max(...peakHours.map(p => parseInt(p.reservation_count || 0)));
                      const percentage = maxReservations > 0 ? ((parseInt(h.reservation_count) / maxReservations) * 100) : 0;
                      
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

      {/* Recent Reservations */}
      <Row>
        <Col md={12}>
          <Card className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">📅 Recent Reservations</Card.Title>
              <Button variant="link" size="sm" onClick={() => navigate("/admin/orders")}>
                View All Orders →
              </Button>
            </Card.Header>
            <Card.Body>
              {recentReservations.length === 0 ? (
                <p className="text-muted text-center">No reservations found</p>
              ) : (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Customer</th>
                      <th>Restaurant</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Party</th>
                      <th>Table</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReservations.map((r) => (
                      <tr key={r.id}>
                        <td>#{r.id}</td>
                        <td>
                          <div>{r.customer_name || 'Unknown'}</div>
                          <small className="text-muted">{r.customer_email}</small>
                        </td>
                        <td>{r.restaurant_name}</td>
                        <td>{formatDate(r.reservation_date)}</td>
                        <td>{formatTime(r.reservation_time)}</td>
                        <td>{r.party_size} guests</td>
                        <td>{r.table_name || `Table ${r.table_id}`}</td>
                        <td>{getStatusBadge(r.status)}</td>
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
