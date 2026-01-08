import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { RoleContext } from "../../context/RoleContext";

// Mock staff database (in production, this would be from a database)
const staffDatabase = [
  { username: "staff", password: "password123", role: "staff", restaurantId: 1 },
  { username: "manager", password: "manager123", role: "manager", restaurantId: 1 },
  { username: "staff2", password: "password123", role: "staff", restaurantId: 2 },
  { username: "manager2", password: "manager123", role: "manager", restaurantId: 2 },
];

export default function StaffLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setRole } = useContext(RoleContext);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = staffDatabase.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      // Set role based on user type
      setRole(user.role, user.restaurantId);
      navigate("/staff/dashboard");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <Container className="py-5">
      <Card className="shadow mx-auto" style={{ maxWidth: "400px" }}>
        <Card.Header className="bg-primary text-white">
          <h3 className="mb-0">Staff Login</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100">
              Login
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
