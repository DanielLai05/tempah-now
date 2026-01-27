// StaffOrders.jsx - View and manage orders
import React, { useState, useEffect, useContext } from "react";
import { Container, Table, Button, Badge, Card, Row, Col, Spinner, Alert } from "react-bootstrap";
import { RoleContext } from "../../context/RoleContext";
import { staffAPI } from "../../services/api";
import { formatPrice } from "../../utils/formatters";

export default function StaffOrders() {
  const { userRole, isManager, userRestaurantId, clearRole } = useContext(RoleContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffAPI.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      // Check if auth error
      if (err.message?.includes('token') || err.message?.includes('auth')) {
        clearRole();
        window.location.href = '/staff/login';
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

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await staffAPI.updateOrderStatus(orderId, newStatus);
      // Refresh orders
      fetchOrders();
    } catch (err) {
      console.error('Error updating order:', err);
      alert(err.message || "Failed to update order");
    }
  };

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

  const getNextStatus = (currentStatus) => {
    const flow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'completed'
    };
    return flow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      pending: 'Confirm',
      confirmed: 'Start Preparing',
      preparing: 'Mark Ready',
      ready: 'Complete'
    };
    return labels[currentStatus];
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Manage Orders</h2>
          <p className="text-muted mb-0">
            {isManager ? 'Manager View - All Restaurants' : 'Staff View - Your Restaurant'}
          </p>
        </div>
        <div>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={fetchOrders}
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
          variant={statusFilter === "preparing" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("preparing")}
        >
          Preparing
        </Button>
        <Button 
          variant={statusFilter === "ready" ? "primary" : "outline-secondary"}
          size="sm"
          className="me-2"
          onClick={() => setStatusFilter("ready")}
        >
          Ready
        </Button>
        <Button 
          variant={statusFilter === "completed" ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => setStatusFilter("completed")}
        >
          Completed
        </Button>
      </div>

      {/* Orders Summary */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-6">{orders.length}</Card.Title>
              <Card.Text>Total Orders</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-warning-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {orders.filter(o => o.status === 'pending').length}
              </Card.Title>
              <Card.Text>Pending</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-primary-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length}
              </Card.Title>
              <Card.Text>In Progress</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center bg-success-subtle">
            <Card.Body>
              <Card.Title className="display-6">
                {orders.filter(o => o.status === 'completed').length}
              </Card.Title>
              <Card.Text>Completed</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

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
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer_email || 'Unknown'}</td>
                <td>{order.restaurant_name}</td>
                <td>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => alert(`Order items would be displayed here\n\nOrder #${order.id}`)}
                  >
                    View Items
                  </Button>
                </td>
                <td>{formatPrice(order.total_amount || 0)}</td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  {order.created_at 
                    ? new Date(order.created_at).toLocaleString()
                    : '-'
                  }
                </td>
                <td>
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <>
                      <Button 
                        variant="success" 
                        size="sm" 
                        className="me-1"
                        onClick={() => handleUpdateStatus(order.id, getNextStatus(order.status))}
                      >
                        {getNextStatusLabel(order.status)}
                      </Button>
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
                    </>
                  )}
                  {order.status === 'completed' && (
                    <Badge bg="secondary">Finished</Badge>
                  )}
                  {order.status === 'cancelled' && (
                    <Badge bg="danger">Cancelled</Badge>
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
