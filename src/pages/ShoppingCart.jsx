// src/pages/ShoppingCart.jsx
import React, { useContext } from "react";
import { Container, Table, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

export default function ShoppingCart() {
  const navigate = useNavigate();
  const { cart = [], clearCart } = useContext(AppContext); // 默认 []

  if (!cart || cart.length === 0) {
    return (
      <Container className="my-5">
        <p>Cart is empty.</p>
        <Button variant="primary" onClick={() => navigate("/home")}>Back to Home</Button>
      </Container>
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Container className="my-5">
      <h2>Shopping Cart</h2>
      <Table striped bordered>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((c, idx) => (
            <tr key={idx}>
              <td>{c.name}</td>
              <td>{c.quantity}</td>
              <td>${c.price * c.quantity}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <h4>Subtotal: ${subtotal}</h4>
      <Button variant="secondary" className="me-2" onClick={() => navigate(-1)}>Back</Button>
      <Button variant="success" onClick={() => navigate("/reservation")}>Proceed to Reservation</Button>
      <Button variant="danger" className="ms-2" onClick={clearCart}>Clear Cart</Button>
    </Container>
  );
}
