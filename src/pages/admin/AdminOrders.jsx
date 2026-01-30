// AdminOrders.jsx - All Orders Management for Admin
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { adminAPI } from "../../services/api";

export default function AdminOrders() {
  const navigate = useNavigate();
  const { clearRole, userRole } = useContext(RoleContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getAllOrders(statusFilter || undefined);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      if (err.message?.includes('token') || err.message?.includes('auth')) {
        clearRole();
        navigate("/admin/login");
      } else {
        setError(err.message || "Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

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
        year: 'numeric',
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
      confirmed: 'info',
      preparing: 'primary',
      ready: 'success',
      completed: 'secondary',
      cancelled: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#0dcaf0',
      preparing: '#0d6efd',
      ready: '#198754',
      completed: '#6c757d',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading orders...</p>
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
          <h2>All Orders Management</h2>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={handleLogout}>
            Logout
          </Button>
          <Form.Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Form.Select>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Order Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-4">{orders.length}</Card.Title>
              <Card.Text>Total Orders</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center" style={{ borderTop: '4px solid #ffc107' }}>
            <Card.Body>
              <Card.Title className="display-4 text-warning">
                {orders.filter(o => o.status === 'pending').length}
              </Card.Title>
              <Card.Text>Pending</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center" style={{ borderTop: '4px solid #0d6efd' }}>
            <Card.Body>
              <Card.Title className="display-4 text-primary">
                {orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length}
              </Card.Title>
              <Card.Text>In Progress</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center" style={{ borderTop: '4px solid #198754' }}>
            <Card.Body>
              <Card.Title className="display-4 text-success">
                {orders.filter(o => o.status === 'completed').length}
              </Card.Title>
              <Card.Text>Completed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Orders Table */}
      <Card className="shadow-sm">
        <Card.Body>
          {orders.length === 0 ? (
            <div className="text-center text-muted py-4">
              <p className="mb-0">No orders found.</p>
            </div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>{o.customer_email || 'Unknown'}</td>
                    <td>{o.restaurant_name || 'Unknown'}</td>
                    <td>{formatCurrency(o.total_amount)}</td>
                    <td>{getStatusBadge(o.status)}</td>
                    <td><small>{formatDate(o.created_at)}</small></td>
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
