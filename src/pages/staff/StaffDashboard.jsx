import React from "react";
import { Container, Card, Button, Row, Col, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function StaffDashboard() {
  const navigate = useNavigate();

  // Mock 数据示例
  const todayOrders = [
    { id: 1, customer: "John Doe", total: 45.0, status: "Pending" },
    { id: 2, customer: "Jane Smith", total: 32.5, status: "Completed" },
  ];

  const todayReservations = [
    { id: 1, customer: "Alice", date: "2025-12-22", time: "18:00", partySize: 4, status: "Confirmed" },
    { id: 2, customer: "Bob", date: "2025-12-22", time: "19:00", partySize: 2, status: "Pending" },
  ];

  return (
    <Container className="my-5">
      <h2>Staff Dashboard</h2>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow">
            <Card.Header>
              <h5>Today's Orders</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayOrders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>${order.total.toFixed(2)}</td>
                      <td>{order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Button variant="primary" onClick={() => navigate("/staff/orders")}>Manage Orders</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow">
            <Card.Header>
              <h5>Today's Reservations</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Party Size</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayReservations.map(res => (
                    <tr key={res.id}>
                      <td>{res.id}</td>
                      <td>{res.customer}</td>
                      <td>{res.date}</td>
                      <td>{res.time}</td>
                      <td>{res.partySize}</td>
                      <td>{res.status}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Button variant="primary" onClick={() => navigate("/staff/reservations")}>Manage Reservations</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
