import React from "react";
import { Container, Card, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <Container className="my-5">
      <h2>Admin Dashboard</h2>
      <Row className="mt-4">
        <Col md={4}>
          <Card className="shadow p-3">
            <h5>Total Restaurants</h5>
            <p>10</p>
            <Button variant="primary" onClick={() => navigate("/admin/restaurants")}>
              Manage Restaurants
            </Button>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow p-3">
            <h5>Total Orders</h5>
            <p>120</p>
            <Button variant="primary" onClick={() => navigate("/admin/orders")}>
              View Orders
            </Button>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow p-3">
            <h5>Staff Accounts</h5>
            <p>15</p>
            <Button variant="primary" onClick={() => navigate("/admin/staff")}>
              Manage Staff
            </Button>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
