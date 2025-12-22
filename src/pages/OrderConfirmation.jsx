// src/pages/OrderConfirmation.jsx
import React from "react";
import { Container, Card, Table, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { order = [], subtotal = 0, customer = {} } = location.state || {};

  if (!order.length) {
    return (
      <Container className="my-5">
        <p>No order found. Please go back to <Button variant="link" onClick={() => navigate('/home')}>Home</Button>.</p>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <Card className="shadow">
        <Card.Header className="bg-success text-white">
          <h3 className="mb-0">Order Confirmed!</h3>
        </Card.Header>
        <Card.Body>
          <h5>Thank you, {customer.name || 'Customer'}!</h5>
          <p>Your order has been successfully placed.</p>

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
              {order.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>RM {item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <h5>Total: RM {subtotal}</h5>

          <h5 className="mt-4">Customer Info</h5>
          <p>Email: {customer.email}</p>
          <p>Phone: {customer.phone || '-'}</p>

          <Button variant="primary" onClick={() => navigate('/home')} className="mt-3">
            Back to Home
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}
