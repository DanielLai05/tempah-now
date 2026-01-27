// StaffReservations.jsx - View and manage reservations
import React, { useState, useEffect, useContext } from "react";
import { Container, Table, Button, Badge, Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import { RoleContext } from "../../context/RoleContext";
import { staffAPI } from "../../services/api";

export default function StaffReservations() {
  const { userRole, isManager, userRestaurantId, clearRole } = useContext(RoleContext);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch reservations
  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffAPI.getReservations();
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      
      // Check if auth error
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

  // Update reservation status
  const handleUpdateStatus = async (reservationId, newStatus) => {
    try {
      await staffAPI.updateReservationStatus(reservationId, newStatus);
      // Refresh reservations
      fetchReservations();
    } catch (err) {
      console.error('Error updating reservation:', err);
      alert(err.message || "Failed to update reservation");
    }
  };

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      // Handle different date formats
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

  if (loading) {
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
          <h2>Manage Reservations</h2>
          <p className="text-muted mb-0">
            {isManager ? 'Manager View - All Restaurants' : 'Staff View - Your Restaurant'}
          </p>
        </div>
        <div>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={fetchReservations}
            className="me-2"
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Status Filter */}
      <div className="mb-4">
        <Button 
          variant={statusFilter === "" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("")}
        >
          All
        </Button>
        <Button 
          variant={statusFilter === "pending" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("pending")}
        >
          Pending
        </Button>
        <Button 
          variant={statusFilter === "confirmed" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("confirmed")}
        >
          Confirmed
        </Button>
        <Button 
          variant={statusFilter === "completed" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("completed")}
        >
          Completed
        </Button>
        <Button 
          variant={statusFilter === "cancelled" ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => setStatusFilter("cancelled")}
        >
          Cancelled
        </Button>
      </div>

      {/* Reservations Summary */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">{reservations.length}</Card.Title>
              <Card.Text>Total Reservations</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-warning-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {reservations.filter(r => r.status === 'pending').length}
              </Card.Title>
              <Card.Text>Pending</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-success-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {reservations.filter(r => r.status === 'confirmed').length}
              </Card.Title>
              <Card.Text>Confirmed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-info-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {reservations.filter(r => r.status === 'completed').length}
              </Card.Title>
              <Card.Text>Completed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Reservations Table */}
      {filteredReservations.length === 0 ? (
        <Alert variant="info">
          No reservations found {statusFilter && `with status "${statusFilter}"`}.
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Restaurant</th>
              <th>Date</th>
              <th>Time</th>
              <th>Party Size</th>
              <th>Table</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.map(res => (
              <tr key={res.id}>
                <td>#{res.id}</td>
                <td>
                  <div>{res.customer_name || 'Unknown'}</div>
                  <small className="text-muted">{res.customer_email}</small>
                  <div><small className="text-muted">{res.customer_phone}</small></div>
                </td>
                <td>{res.restaurant_name}</td>
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
                    <Badge bg="secondary">Finished</Badge>
                  )}
                  {res.status === 'cancelled' && (
                    <Badge bg="danger">Cancelled</Badge>
                  )}
                  {res.status === 'no-show' && (
                    <Badge bg="dark">No Show</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
