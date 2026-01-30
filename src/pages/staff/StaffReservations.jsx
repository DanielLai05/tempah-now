// StaffReservations.jsx - View and manage reservations
import React, { useState, useEffect, useContext } from "react";
import { Container, Table, Button, Badge, Card, Row, Col, Spinner, Alert, Collapse } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { staffAPI, restaurantAPI } from "../../services/api";

export default function StaffReservations() {
  const navigate = useNavigate();
  const { userRestaurantId, clearRole, userRole } = useContext(RoleContext);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [expandedRows, setExpandedRows] = useState({});

  // Redirect if not staff
  useEffect(() => {
    if (userRole && userRole !== 'staff') {
      navigate("/admin/dashboard");
    }
  }, [userRole, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('staffToken');
    clearRole();
    navigate("/staff/login");
  };

  // Fetch restaurants for dropdown
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await restaurantAPI.getAll();
        setRestaurants(data);
        // Set restaurant name based on userRestaurantId
        if (userRestaurantId) {
          const restaurant = data.find(r => r.id === userRestaurantId);
          if (restaurant) {
            setRestaurantName(restaurant.name);
          }
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
      }
    };
    fetchRestaurants();
  }, [userRestaurantId]);

  // Fetch reservations
  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffAPI.getReservations();
      setReservations(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching reservations:', err);

      if (err.message?.includes('token') || err.message?.includes('auth')) {
        clearRole();
        window.location.href = '/staff/login';
      } else {
        setError(err.message || "Failed to load reservations");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [userRestaurantId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReservations();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter reservations by status
  const filteredReservations = statusFilter
    ? reservations.filter(r => r.status === statusFilter)
    : reservations;

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'success',
      completed: 'secondary',
      cancelled: 'danger',
      'no-show': 'dark'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getOrderStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      preparing: 'info',
      ready: 'success',
      completed: 'secondary',
      cancelled: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'} className="ms-1">{status}</Badge>;
  };

  const handleUpdateStatus = async (reservationId, newStatus) => {
    try {
      await staffAPI.updateReservationStatus(reservationId, newStatus);
      fetchReservations();
    } catch (err) {
      console.error('Error updating reservation:', err);
      alert(err.message || "Failed to update reservation");
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && reservations.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading reservations...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="link" onClick={() => navigate("/staff/dashboard")} className="ps-0 mb-2">
            ← Back to Dashboard
          </Button>
          <h2>Manage Reservations</h2>
          <p className="text-muted mb-0">
            Staff View
            {restaurantName && <span> • {restaurantName}</span>}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={fetchReservations}>
            🔄 Refresh
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Status Filter */}
      <div className="mb-4">
        <span className="me-2">Status:</span>
        <Button
          variant={statusFilter === "" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("")}
        >
          All ({reservations.length})
        </Button>
        <Button
          variant={statusFilter === "pending" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("pending")}
        >
          Pending ({reservations.filter(r => r.status === 'pending').length})
        </Button>
        <Button
          variant={statusFilter === "confirmed" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("confirmed")}
        >
          Confirmed ({reservations.filter(r => r.status === 'confirmed').length})
        </Button>
        <Button
          variant={statusFilter === "completed" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("completed")}
        >
          Completed ({reservations.filter(r => r.status === 'completed').length})
        </Button>
        <Button
          variant={statusFilter === "cancelled" ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => setStatusFilter("cancelled")}
        >
          Cancelled ({reservations.filter(r => r.status === 'cancelled').length})
        </Button>
      </div>

      {/* Reservations Summary */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title className="display-6">{reservations.length}</Card.Title>
              <Card.Text>Total Reservations</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-warning-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {reservations.filter(r => r.status === 'pending').length}
              </Card.Title>
              <Card.Text>Pending</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-success-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {reservations.filter(r => r.status === 'confirmed').length}
              </Card.Title>
              <Card.Text>Confirmed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-info-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {reservations.filter(r => r.status === 'completed').length}
              </Card.Title>
              <Card.Text>Completed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Last updated */}
      <div className="text-end mb-3">
        <small className="text-muted">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </small>
      </div>

      {/* Reservations Table */}
      {filteredReservations.length === 0 ? (
        <Alert variant="info">
          No reservations found {statusFilter && `with status "${statusFilter}"`}.
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>ID</th>
              <th>Customer</th>
              <th>Contact</th>
              <th>Date</th>
              <th>Time</th>
              <th>Party</th>
              <th>Table</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.map(res => (
              <React.Fragment key={res.id}>
                <tr>
                  <td>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => toggleRow(res.id)}
                      className="p-0 text-decoration-none"
                    >
                      {expandedRows[res.id] ? '▼' : '▶'}
                    </Button>
                  </td>
                  <td>#{res.id}</td>
                  <td>
                    <div className="fw-semibold">{res.customer_name || 'Unknown'}</div>
                    <small className="text-muted">{res.customer_email}</small>
                  </td>
                  <td>
                    <small>{res.customer_phone || '-'}</small>
                  </td>
                  <td>{formatDate(res.reservation_date)}</td>
                  <td>{formatTime(res.reservation_time)}</td>
                  <td>{res.party_size} guests</td>
                  <td>
                    <Badge bg="secondary">{res.table_name || `Table ${res.table_id}`}</Badge>
                  </td>
                  <td>{getStatusBadge(res.status)}</td>
                  <td>
                    {res.status === 'pending' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          className="me-1"
                          onClick={() => handleUpdateStatus(res.id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this reservation?')) {
                              handleUpdateStatus(res.id, 'cancelled');
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {res.status === 'confirmed' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleUpdateStatus(res.id, 'completed')}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleUpdateStatus(res.id, 'no-show')}
                        >
                          No Show
                        </Button>
                      </>
                    )}
                    {res.status === 'completed' && (
                      <Badge bg="secondary">✓ Finished</Badge>
                    )}
                    {res.status === 'cancelled' && (
                      <Badge bg="danger">✗ Cancelled</Badge>
                    )}
                    {res.status === 'no-show' && (
                      <Badge bg="dark">No Show</Badge>
                    )}
                  </td>
                </tr>
                <tr>
                  <td colSpan="10" className="p-0 border-0">
                    <Collapse in={expandedRows[res.id]}>
                      <div className="bg-light p-3">
                        <h6 className="mb-3">🍽️ Food Orders</h6>
                        {res.orders && res.orders.length > 0 ? (
                          res.orders.map(order => (
                            <Card key={order.id} className="mb-3">
                              <Card.Header className="d-flex justify-content-between align-items-center py-2">
                                <div>
                                  <strong>Order #{order.id}</strong>
                                  {getOrderStatusBadge(order.status)}
                                </div>
                                <span className="fw-bold">
                                  {formatCurrency(order.total_amount)}
                                </span>
                              </Card.Header>
                              <Card.Body className="py-2">
                                <Table striped bordered hover size="sm" className="mb-0">
                                  <thead className="table-light">
                                    <tr>
                                      <th>Item</th>
                                      <th className="text-center">Qty</th>
                                      <th className="text-end">Price</th>
                                      <th className="text-end">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items && order.items.length > 0 ? (
                                      order.items.map((item, idx) => (
                                        <tr key={idx}>
                                          <td>
                                            {item.item_name || 'Unknown Item'}
                                            {item.special_instructions && (
                                              <div className="text-muted small">
                                                Note: {item.special_instructions}
                                              </div>
                                            )}
                                          </td>
                                          <td className="text-center">{item.quantity}</td>
                                          <td className="text-end">{formatCurrency(item.unit_price)}</td>
                                          <td className="text-end">{formatCurrency(item.subtotal)}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="4" className="text-center text-muted">
                                          No items found
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </Table>
                              </Card.Body>
                            </Card>
                          ))
                        ) : (
                          <Alert variant="info" className="mb-0">
                            No food orders for this reservation
                          </Alert>
                        )}
                      </div>
                    </Collapse>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
