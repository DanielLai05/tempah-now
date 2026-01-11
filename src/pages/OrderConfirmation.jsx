// OrderConfirmation.jsx
import React from "react";
import { Container, Card, Table, Button, Badge } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { formatPrice } from "../utils/formatters";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    order = [], 
    subtotal = 0, 
    cart = [], 
    customer = {}, 
    reservation = {}, 
    restaurant = {},
    paymentMethod = 'counter',
    paymentStatus = 'completed'
  } = location.state || {};
  const orderItems = order.length > 0 ? order : cart;

  return (
    <>
      <Navbar />
      <Container className="my-5">
      <Card className="shadow">
        <Card.Header className="bg-success text-white">
          <h3 className="mb-0">Booking Confirmed!</h3>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <div style={{ fontSize: "4rem", color: "#4CAF50", marginBottom: "1rem" }}>✓</div>
            <h5>Thank you, {customer.name || customer.email?.split("@")[0] || 'Customer'}!</h5>
          </div>

          {orderItems.length > 0 ? (
            <>
              <p className="text-center text-muted">Your order has been successfully placed.</p>

              <h5 className="mt-4">Order Summary</h5>
              <Table striped bordered>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <h5 className="mb-0">Total:</h5>
                <h5 className="mb-0 text-primary">{formatPrice(subtotal || orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0))}</h5>
              </div>
            </>
          ) : (
            <p className="text-center text-muted">Your table reservation has been successfully booked.</p>
          )}

          <h5 className="mt-4">Reservation Info</h5>
          <p><strong>Restaurant:</strong> {reservation.restaurant || restaurant?.name || '-'}</p>
          <p><strong>Table:</strong> {reservation.table || '-'}</p>
          <p><strong>Date:</strong> {reservation.date || '-'}</p>
          <p><strong>Time:</strong> {reservation.time || '-'}</p>
          <p><strong>Party Size:</strong> {reservation.partySize || '-'} people</p>

          <h5 className="mt-4">Payment Info</h5>
          <p>
            <strong>Payment Method:</strong> 
            <Badge bg={paymentMethod === 'gateway' ? 'success' : 'info'} className="ms-2">
              {paymentMethod === 'gateway' ? 'Online Payment' : 'Pay at Counter'}
            </Badge>
          </p>
          {paymentMethod === 'gateway' && (
            <p><strong>Payment Status:</strong> 
              <Badge bg={paymentStatus === 'completed' ? 'success' : 'warning'} className="ms-2">
                {paymentStatus === 'completed' ? 'Completed' : 'Pending'}
              </Badge>
            </p>
          )}

          <h5 className="mt-4">Customer Info</h5>
          <p><strong>Name:</strong> {customer.name || '-'}</p>
          <p><strong>Email:</strong> {customer.email || '-'}</p>
          <p><strong>Phone:</strong> {customer.phone || '-'}</p>

          <div className="text-center mt-4">
            <Button 
              variant="primary" 
              onClick={() => navigate('/home')} 
              size="lg"
              style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
            >
              Back to Home
            </Button>
          </div>
        </Card.Body>
      </Card>
      </Container>
    </>
  );
}
