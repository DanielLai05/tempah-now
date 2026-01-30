// AdminStaff.jsx - Staff Management for Admin
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Table, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { adminAPI, restaurantAPI } from "../../services/api";

export default function AdminStaff() {
  const navigate = useNavigate();
  const { clearRole, userRole } = useContext(RoleContext);
  const [staff, setStaff] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "staff",
    restaurant_id: ""
  });

  // Redirect if not admin
  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate("/staff/dashboard");
    }
  }, [userRole, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    clearRole();
    navigate("/admin/login");
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [staffData, restaurantsData] = await Promise.all([
        adminAPI.getAllStaff(),
        restaurantAPI.getAll()
      ]);
      setStaff(staffData);
      setRestaurants(restaurantsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.message?.includes('token') || err.message?.includes('auth')) {
        clearRole();
        navigate("/admin/login");
      } else {
        setError(err.message || "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingStaff(member);
      setFormData({
        email: member.email || "",
        password: "",
        first_name: member.first_name || "",
        last_name: member.last_name || "",
        role: member.role || "staff",
        restaurant_id: member.restaurant_id ? String(member.restaurant_id) : ""
      });
    } else {
      setEditingStaff(null);
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "staff",
        restaurant_id: restaurants[0]?.id ? String(restaurants[0].id) : ""
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        restaurant_id: parseInt(formData.restaurant_id)
      };
      
      if (editingStaff) {
        // Remove password if not provided (don't update password)
        if (!submitData.password) {
          delete submitData.password;
        }
        await adminAPI.updateStaff(editingStaff.id, submitData);
      } else {
        if (!submitData.password) {
          alert('Password is required for new staff');
          return;
        }
        await adminAPI.createStaff(submitData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.message || "Failed to save staff"));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await adminAPI.deleteStaff(id);
        fetchData();
      } catch (err) {
        alert('Error: ' + (err.message || "Failed to delete staff"));
      }
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      staff: "info"
    };
    return <Badge bg={variants[role] || "secondary"}>{role}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading staff...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="link" onClick={() => navigate("/admin/dashboard")}>
            ← Back to Dashboard
          </Button>
          <h2>Staff Management</h2>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={handleLogout}>
            Logout
          </Button>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            + Add New Staff
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Staff Stats */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-4">{staff.length}</Card.Title>
              <Card.Text>Total Staff</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-4 text-info">
                {staff.filter(s => s.role === 'staff').length}
              </Card.Title>
              <Card.Text>Staff Members</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-4">{restaurants.length}</Card.Title>
              <Card.Text>Restaurants</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Staff Table */}
      <Card className="shadow-sm">
        <Card.Body>
          {staff.length === 0 ? (
            <div className="text-center text-muted py-4">
              <p className="mb-0">No staff found. Add one to get started!</p>
            </div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Restaurant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>
                      <strong>{s.first_name} {s.last_name}</strong>
                    </td>
                    <td>{s.email}</td>
                    <td>{getRoleBadge(s.role)}</td>
                    <td>{s.restaurant_name || '-'}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleOpenModal(s)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(s.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password {editingStaff ? '(leave blank to keep current)' : '*'}</Form.Label>
                  <Form.Control
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingStaff}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                  >
                    <option value="staff">Staff</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant *</Form.Label>
                  <Form.Select
                    value={formData.restaurant_id}
                    onChange={(e) => setFormData({...formData, restaurant_id: e.target.value})}
                    required
                  >
                    <option value="">Select Restaurant</option>
                    {restaurants.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingStaff ? "Update Staff" : "Add Staff"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
