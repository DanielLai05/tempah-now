// StaffLogin.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { RoleContext } from "../../context/RoleContext";
import { staffAPI } from "../../services/api";

export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setRole } = useContext(RoleContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await staffAPI.login(email, password);

      if (result.token && result.staff) {
        // Store token
        localStorage.setItem('staffToken', result.token);
        
        // Set role context
        setRole(result.staff.role, result.staff.restaurant_id);
        
        // Navigate to dashboard
        navigate("/staff/dashboard");
      }
    } catch (err) {
      console.error('Staff login error:', err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Card className="shadow mx-auto" style={{ maxWidth: "450px" }}>
        <Card.Header 
          style={{ 
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
            color: "white",
            border: "none"
          }}
        >
          <h3 className="mb-0">👔 Staff Login</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter staff email"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </Form.Group>
            <Button 
              type="submit" 
              variant="primary" 
              className="w-100"
              disabled={loading}
              style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none"
              }}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  {' '}Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </Form>
          
          <div className="mt-4 p-3 bg-light rounded">
            <h6 className="mb-2">Demo Accounts:</h6>
            <div className="small">
              <div className="mb-2">
                <strong>Staff (Sushi Palace):</strong><br />
                📧 staff@sushi.com<br />
                🔑 staff123<br />
                🏪 Restaurant: Sushi Palace
              </div>
              <div className="mb-2">
                <strong>Staff (Pasta Paradise):</strong><br />
                📧 staff@pasta.com<br />
                🔑 staff123<br />
                🏪 Restaurant: Pasta Paradise
              </div>
              <div>
                <strong>Staff (Curry House):</strong><br />
                📧 staff@curry.com<br />
                🔑 staff123
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
