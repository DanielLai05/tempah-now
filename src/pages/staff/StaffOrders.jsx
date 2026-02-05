// StaffOrders.jsx - View and manage orders
import React, { useState, useEffect, useContext } from "react";
import { Container, Table, Button, Badge, Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { staffAPI } from "../../services/api";

export default function StaffOrders() {
  const navigate = useNavigate();
  const { clearRole, userRole, userRestaurantId } = useContext(RoleContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

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

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffAPI.getOrders();
      setOrders(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      if (err.message?.includes('token') || err.message?.includes('auth')) {
        handleLogout();
      } else {
        setError(err.message || "Failed to load orders");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userRestaurantId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders by status
  const filteredOrders = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders;

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

  const getPaymentStatusBadge = (status) => {
    const variants = {
      paid: 'success',
      unpaid: 'warning',
      refunded: 'info'
    };
    return <Badge bg={variants[status] || 'warning'}>{status || 'Pay at Counter'}</Badge>;
  };

  const getPaymentMethodBadge = (method) => {
    if (!method) {
      return <Badge bg="secondary">Unknown</Badge>;
    }
    const methodColors = {
      hitpay: 'primary',
      cash: 'success',
      online: 'info',
      card: 'primary',
      fpx: 'warning'
    };
    return <Badge bg={methodColors[method.toLowerCase()] || 'secondary'}>{method}</Badge>;
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

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await staffAPI.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      console.error('Error updating order:', err);
      alert(err.message || "Failed to update order");
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading orders...</p>
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
          <h2>Manage Orders</h2>
          <p className="text-muted mb-0">
            Staff View
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={fetchOrders}>
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
          All ({orders.length})
        </Button>
        <Button 
          variant={statusFilter === "pending" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("pending")}
        >
          Pending ({orders.filter(o => o.status === 'pending').length})
        </Button>
        <Button 
          variant={statusFilter === "confirmed" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("confirmed")}
        >
          Confirmed ({orders.filter(o => o.status === 'confirmed').length})
        </Button>
        <Button 
          variant={statusFilter === "preparing" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("preparing")}
        >
          Preparing ({orders.filter(o => o.status === 'preparing').length})
        </Button>
        <Button 
          variant={statusFilter === "ready" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("ready")}
        >
          Ready ({orders.filter(o => o.status === 'ready').length})
        </Button>
        <Button 
          variant={statusFilter === "completed" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("completed")}
        >
          Completed ({orders.filter(o => o.status === 'completed').length})
        </Button>
        <Button 
          variant={statusFilter === "cancelled" ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => setStatusFilter("cancelled")}
        >
          Cancelled ({orders.filter(o => o.status === 'cancelled').length})
        </Button>
      </div>

      {/* Orders Summary */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <Card.Title className="display-6">{orders.length}</Card.Title>
              <Card.Text>Total Orders</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-warning-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {orders.filter(o => o.status === 'pending').length}
              </Card.Title>
              <Card.Text>Pending</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-primary-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length}
              </Card.Title>
              <Card.Text>In Progress</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-success-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {orders.filter(o => o.status === 'completed').length}
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

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Alert variant="info">
          No orders found {statusFilter && `with status "${statusFilter}"`}.
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Restaurant</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>
                  <div className="fw-semibold">{order.customer_email || 'Unknown'}</div>
                  <small className="text-muted">{order.customer_name || ''}</small>
                </td>
                <td>
                  <Badge bg="info">{order.restaurant_name}</Badge>
                </td>
                <td>
                  {formatDate(order.order_date)} {formatTime(order.order_time || '')}
                </td>
                <td>
                  <small>{order.items || order.item_count + ' items'}</small>
                </td>
                <td className="fw-semibold">${order.total_amount?.toFixed(2) || '0.00'}</td>
                <td>{getStatusBadge(order.status)}</td>
                <td>{getPaymentStatusBadge(order.payment_status)}</td>
                <td>{getPaymentMethodBadge(order.payment_method)}</td>
                <td>
                  {order.status === 'pending' && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="me-1"
                      onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                    >
                      Confirm
                    </Button>
                  )}
                  {order.status === 'confirmed' && (
                    <Button 
                      variant="info" 
                      size="sm" 
                      className="me-1"
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="me-1"
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="me-1"
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                    >
                      Complete
                    </Button>
                  )}
                  {['pending', 'confirmed'].includes(order.status) && (
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this order?')) {
                          handleUpdateStatus(order.id, 'cancelled');
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  {order.status === 'completed' && (
                    <Badge bg="success">✓ Done</Badge>
                  )}
                  {order.status === 'cancelled' && (
                    <Badge bg="danger">✗ Cancelled</Badge>
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
