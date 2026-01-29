// AdminReservations.jsx - All Reservations Management for Admin
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { adminAPI } from "../../services/api";

export default function AdminReservations() {
  const navigate = useNavigate();
  const { clearRole } = useContext(RoleContext);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getAllReservations(statusFilter || undefined);
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      if (err.message?.includes('token') || err.message?.includes('auth')) {
        clearRole();
        navigate("/admin/login");
      } else {
        setError(err.message || "Failed to load reservations");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

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
      cancelled: 'danger',
      'no-show': 'dark'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="link" onClick={() => navigate("/admin/dashboard")}>
            ← Back to Dashboard
          </Button>
          <h2>📅 All Reservations Management</h2>
        </div>
        <Form.Select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '200px' }}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No Show</option>
        </Form.Select>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Reservation Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-4">{reservations.length}</Card.Title>
              <Card.Text>Total Reservations</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center" style={{ borderTop: '4px solid #ffc107' }}>
            <Card.Body>
              <Card.Title className="display-4 text-warning">
                {reservations.filter(r => r.status === 'pending').length}
              </Card.Title>
              <Card.Text>Pending</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center" style={{ borderTop: '4px solid #198754' }}>
            <Card.Body>
              <Card.Title className="display-4 text-success">
                {reservations.filter(r => r.status === 'confirmed').length}
              </Card.Title>
              <Card.Text>Confirmed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center" style={{ borderTop: '4px solid #6c757d' }}>
            <Card.Body>
              <Card.Title className="display-4 text-secondary">
                {reservations.filter(r => r.status === 'completed').length}
              </Card.Title>
              <Card.Text>Completed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Reservations Table */}
      <Card className="shadow-sm">
        <Card.Body>
          {reservations.length === 0 ? (
            <div className="text-center text-muted py-4">
              <p className="mb-0">No reservations found.</p>
            </div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Party Size</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td><strong>#{r.id}</strong></td>
                    <td>{r.customer_name || r.customer_email || 'Unknown'}</td>
                    <td>{r.restaurant_name || 'Unknown'}</td>
                    <td>{formatDate(r.reservation_date)}</td>
                    <td>{formatTime(r.reservation_time)}</td>
                    <td>{r.party_size}</td>
                    <td>{getStatusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}



