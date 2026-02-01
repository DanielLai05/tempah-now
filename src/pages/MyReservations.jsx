// MyReservations.jsx
import React, { useState, useEffect, useContext } from "react";
import { Container, Card, Row, Col, Button, Badge, Spinner, Alert, Table, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context";
import { reservationAPI, orderAPI } from "../services/api";

export default function MyReservations() {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedReservations, setExpandedReservations] = useState({});

  // Cancel modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReservationId, setWithdrawReservationId] = useState(null);

  const [cancelReason, setCancelReason] = useState("");
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to be determined
    if (currentUser === undefined) {
      return; // Still loading
    }

    setAuthLoading(false);

    if (!currentUser) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both reservations and orders in parallel
        const [reservationsData, ordersData] = await Promise.all([
          reservationAPI.getUserReservations().catch(err => {
            console.error('Error fetching reservations:', err);
            return [];
          }),
          orderAPI.getUserOrders().catch(err => {
            console.error('Error fetching orders:', err);
            return [];
          })
        ]);

        setReservations(reservationsData || []);
        setOrders(ordersData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  // Get orders for a specific reservation
  const getReservationOrders = (reservationId) => {
    if (!reservationId) return [];
    return orders.filter(order => order.reservation_id === reservationId);
  };

  // Toggle expanded reservation
  const toggleExpand = (reservationId) => {
    setExpandedReservations(prev => ({
      ...prev,
      [reservationId]: !prev[reservationId]
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <Badge bg="success">Confirmed</Badge>;
      case 'pending':
        return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      case 'completed':
        return <Badge bg="info">Completed</Badge>;
      case 'ready':
        return <Badge bg="success">Ready</Badge>;
      case 'preparing':
        return <Badge bg="info">Preparing</Badge>;
      case 'no-show':
        return <Badge bg="dark">No Show</Badge>;
      case 'cancellation_requested':
        return <Badge bg="warning" text="dark">Cancellation Requested</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
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
    if (timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    }
    return timeStr;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Cancellation handlers
  const handleOpenCancelModal = (reservationId) => {
    setSelectedReservationId(reservationId);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedReservationId(null);
    setCancelReason("");
  };

  const handleConfirmCancel = () => {
    setShowConfirmModal(false);
    handleRequestCancellation();
  };

  const handleRequestCancellation = async () => {
    if (!selectedReservationId) return;

    try {
      setActionLoading(true);
      await reservationAPI.requestCancellation(selectedReservationId, cancelReason);
      handleCloseCancelModal();
      // Refresh data
      const reservationsData = await reservationAPI.getUserReservations().catch(err => {
        console.error('Error fetching reservations:', err);
        return [];
      });
      setReservations(reservationsData || []);
      // Show success modal
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error requesting cancellation:', err);
      alert(err.message || 'Failed to submit cancellation request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleWithdrawCancellation = async (reservationId) => {
    setWithdrawReservationId(reservationId);
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawReservationId) return;

    try {
      setActionLoading(true);
      await reservationAPI.cancelRequest(withdrawReservationId);
      // Refresh data
      const reservationsData = await reservationAPI.getUserReservations().catch(err => {
        console.error('Error fetching reservations:', err);
        return [];
      });
      setReservations(reservationsData || []);
      setShowWithdrawModal(false);
      // Show success modal
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error withdrawing cancellation:', err);
      alert(err.message || 'Failed to withdraw cancellation request');
    } finally {
      setActionLoading(false);
      setWithdrawReservationId(null);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <>
        <Navbar />
        <Container className="my-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Checking authentication...</p>
        </Container>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <Container className="my-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading your data...</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container className="my-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">My Reservations</h2>
          <Button
            style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
            onClick={() => navigate("/table-reservation")}
          >
            New Reservation
          </Button>
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
            <Button variant="link" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Alert>
        )}

        {reservations.length === 0 ? (
          <Card className="text-center py-5">
            <Card.Body>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📅</div>
              <h4>No Reservations Yet</h4>
              <p className="text-muted mb-4">
                You haven't made any table reservations yet.
              </p>
              <Button
                style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
                onClick={() => navigate("/table-reservation")}
              >
                Make Your First Reservation
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Row xs={1} className="g-4">
            {reservations.map((reservation) => {
              const reservationOrders = getReservationOrders(reservation.id);
              const isExpanded = expandedReservations[reservation.id];
              // Fix: Parse total_amount as float to avoid string concatenation (0 + "155.96" = "0155.96")
              const totalOrderAmount = reservationOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

              return (
                <Col key={reservation.id}>
                  <Card className="shadow-sm">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-bold me-2">
                          {reservation.restaurant_name || `Restaurant #${reservation.restaurant_id}`}
                        </span>
                        {getStatusBadge(reservation.status)}
                        {reservationOrders.length > 0 && (
                          <Badge bg="info" className="ms-2">
                            {reservationOrders.length} Food Order(s) • {formatCurrency(totalOrderAmount)}
                          </Badge>
                        )}
                      </div>
                      {reservationOrders.length > 0 && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => toggleExpand(reservation.id)}
                        >
                          {isExpanded ? 'Hide Details' : 'Show Details'}
                        </Button>
                      )}
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <p className="mb-2">
                            <i className="bi bi-calendar me-2"></i>
                            <strong>Date:</strong> {formatDate(reservation.reservation_date)}
                          </p>
                          <p className="mb-2">
                            <i className="bi bi-clock me-2"></i>
                            <strong>Time:</strong> {formatTime(reservation.reservation_time)}
                          </p>
                          <p className="mb-2">
                            <i className="bi bi-people me-2"></i>
                            <strong>Party Size:</strong> {reservation.party_size} guests
                          </p>
                        </Col>
                        <Col md={6}>
                          {reservation.table_id && (
                            <p className="mb-2">
                              <i className="bi bi-grid me-2"></i>
                              <strong>Table:</strong> {reservation.table_id}
                            </p>
                          )}
                          {reservation.special_requests && (
                            <p className="mb-2">
                              <i className="bi bi-chat-left-text me-2"></i>
                              <strong>Notes:</strong> {reservation.special_requests}
                            </p>
                          )}
                          <p className="mb-2">
                            <i className="bi bi-calendar-check me-2"></i>
                            <strong>Booked:</strong> {new Date(reservation.created_at).toLocaleDateString()}
                          </p>
                        </Col>
                      </Row>

                      {/* Expanded Section - Food Orders - ONLY SHOW IF ORDERS EXIST */}
                      {isExpanded && reservationOrders.length > 0 && (
                        <div className="mt-4 pt-3 border-top">
                          <h5 className="mb-3">🍽️ Food Orders</h5>

                          {reservationOrders.map((order) => (
                            <Card key={order.id} className="mb-3 bg-light">
                              <Card.Body className="py-2">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <div>
                                    <strong>Order #{order.id}</strong>
                                    <span className="ms-2">
                                      {getStatusBadge(order.status)}
                                    </span>
                                  </div>
                                  <span className="fw-bold">
                                    {formatCurrency(parseFloat(order.total_amount) || 0)}
                                  </span>
                                </div>
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
                                          <td className="text-end">{formatCurrency(parseFloat(item.unit_price) || 0)}</td>
                                          <td className="text-end">{formatCurrency((parseFloat(item.subtotal) || parseFloat(item.unit_price) * item.quantity) || 0)}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="4" className="text-center text-muted">
                                          Order items not available
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </Table>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                    <Card.Footer className="bg-white">
                      {/* Show cancellation request reason if applicable */}
                      {reservation.cancellation_reason && (
                        <Alert variant="warning" className="mb-2 py-2">
                          <small>
                            <strong>Cancellation Reason:</strong> {reservation.cancellation_reason}
                          </small>
                        </Alert>
                      )}

                      {/* Cancellation Requested - Show withdraw button */}
                      {reservation.status === 'cancellation_requested' && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleWithdrawCancellation(reservation.id)}
                          disabled={actionLoading}
                        >
                          Withdraw Cancellation Request
                        </Button>
                      )}

                      {/* Pending - Show Cancel button */}
                      {reservation.status === 'pending' && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleOpenCancelModal(reservation.id)}
                        >
                          Cancel Reservation
                        </Button>
                      )}

                      {/* Confirmed - Show Request Cancellation button */}
                      {reservation.status === 'confirmed' && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleOpenCancelModal(reservation.id)}
                        >
                          Request Cancellation
                        </Button>
                      )}
                    </Card.Footer>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* Separate Orders Section - Orders without reservations */}
        {orders.filter(o => !o.reservation_id).length > 0 && (
          <div className="mt-5">
            <h4 className="mb-4">📦 Additional Food Orders</h4>
            <Card className="shadow-sm">
              <Card.Header>
                <strong>Orders without reservation</strong>
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Restaurant</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter(o => !o.reservation_id)
                      .map((order) => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{order.restaurant_name || `Restaurant #${order.restaurant_id}`}</td>
                          <td>{formatDate(order.order_date)}</td>
                          <td>
                            {order.items && order.items.length > 0 ? (
                              <ul className="mb-0 ps-3">
                                {order.items.slice(0, 3).map((item, idx) => (
                                  <li key={idx}>
                                    {item.item_name || 'Item'} x {item.quantity}
                                  </li>
                                ))}
                                {order.items.length > 3 && (
                                  <li className="text-muted">
                                    +{order.items.length - 3} more items
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <span className="text-muted">View details</span>
                            )}
                          </td>
                          <td className="fw-bold">{formatCurrency(parseFloat(order.total_amount) || 0)}</td>
                          <td>{getStatusBadge(order.status)}</td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        )}
      </Container>

      {/* Cancellation Request Modal - Step 1: Enter Reason */}
      <Modal show={showCancelModal} onHide={handleCloseCancelModal} centered>
        <Modal.Header closeButton style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <Modal.Title style={{ fontWeight: '600' }}>Request Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ paddingTop: 0 }}>
          <p className="text-muted mb-3">Please provide a reason for cancellation:</p>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value.slice(0, 500))}
              placeholder="Enter your reason..."
              maxLength={500}
              style={{ resize: 'none' }}
            />
            <Form.Text className="text-muted d-flex justify-content-end">
              {cancelReason.length}/500 characters
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: 'none', paddingTop: 0 }}>
          <Button
            variant="outline-secondary"
            onClick={handleCloseCancelModal}
            style={{ borderRadius: '8px' }}
          >
            Back
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowConfirmModal(true)}
            disabled={actionLoading}
            style={{
              background: 'linear-gradient(90deg, #dc3545, #c82333)',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            {actionLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal - Step 2: Confirm */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Body className="text-center py-5">
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}
          >
            <span style={{ fontSize: '40px' }}>✕</span>
          </div>
          <h5 className="mb-3" style={{ fontWeight: '600' }}>
            Are you sure you want to cancel your reservation?
          </h5>
          <p className="text-muted mb-4">
            This action cannot be undone. Your cancellation request will be sent to the restaurant staff.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Button
              variant="outline-secondary"
              onClick={() => setShowConfirmModal(false)}
              style={{
                padding: '10px 40px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}
            >
              No
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={actionLoading}
              style={{
                background: 'linear-gradient(90deg, #dc3545, #c82333)',
                border: 'none',
                padding: '10px 40px',
                borderRadius: '8px'
              }}
            >
              {actionLoading ? 'Processing...' : 'Yes'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Success Modal - Step 3: Confirmation */}
      <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered>
        <Modal.Body className="text-center py-5">
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}
          >
            <span style={{ fontSize: '40px' }}>✓</span>
          </div>
          <h5 className="mb-3" style={{ fontWeight: '600' }}>
            Cancellation Request Submitted
          </h5>
          <p className="text-muted mb-4">
            Your cancellation request has been sent to the restaurant staff. They will review and process your request shortly.
          </p>
          <Button
            onClick={handleCloseSuccessModal}
            style={{
              background: 'linear-gradient(90deg, #FF7E5F, #FEB47B)',
              border: 'none',
              padding: '10px 40px',
              borderRadius: '8px'
            }}
          >
            Okay
          </Button>
        </Modal.Body>
      </Modal>

      {/* Withdraw Confirmation Modal */}
      <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)} centered>
        <Modal.Body className="text-center py-5">
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}
          >
            <span style={{ fontSize: '40px' }}>↩</span>
          </div>
          <h5 className="mb-3" style={{ fontWeight: '600' }}>
            Withdraw Cancellation Request?
          </h5>
          <p className="text-muted mb-4">
            Are you sure you want to withdraw your cancellation request? Your reservation will be restored to its previous status.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Button
              variant="outline-secondary"
              onClick={() => setShowWithdrawModal(false)}
              style={{
                padding: '10px 40px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}
            >
              No
            </Button>
            <Button
              onClick={handleConfirmWithdraw}
              disabled={actionLoading}
              style={{
                background: 'linear-gradient(90deg, #FF7E5F, #FEB47B)',
                border: 'none',
                padding: '10px 40px',
                borderRadius: '8px'
              }}
            >
              {actionLoading ? 'Processing...' : 'Yes'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
