import React, { useState } from "react";
import { Container, Table, Button } from "react-bootstrap";

export default function StaffOrders() {
  const [orders, setOrders] = useState([
    { id: 1, customer: "Alice", items: "Sushi Roll x2", total: "$50", status: "Pending" },
    { id: 2, customer: "Bob", items: "Ramen x1", total: "$18", status: "Completed" },
    { id: 3, customer: "Charlie", items: "Sushi Roll x1, Ramen x1", total: "$43", status: "Pending" },
  ]);

  const updateStatus = (id) => {
    setOrders(prev =>
      prev.map(o => o.id === id ? { ...o, status: o.status === "Pending" ? "Completed" : "Pending" } : o)
    );
  };

  return (
    <Container className="py-5">
      <h2>Manage Orders</h2>
      <Table striped bordered>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer}</td>
              <td>{order.items}</td>
              <td>{order.total}</td>
              <td>{order.status}</td>
              <td>
                <Button variant={order.status === "Pending" ? "success" : "secondary"} onClick={() => updateStatus(order.id)}>
                  {order.status === "Pending" ? "Mark Completed" : "Revert"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
