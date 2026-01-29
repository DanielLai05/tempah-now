// AdminRestaurants.jsx - Restaurant Management for Admin
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Table, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { adminAPI } from "../../services/api";

export default function AdminRestaurants() {
  const navigate = useNavigate();
  const { clearRole } = useContext(RoleContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    cuisine: "",
    description: "",
    opening_hours: "",
    capacity: 50,
    is_active: true
  });

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getAllRestaurants();
      setRestaurants(data);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      if (err.message?.includes('token') || err.message?.includes('auth')) {
        clearRole();
        navigate("/admin/login");
      } else {
        setError(err.message || "Failed to load restaurants");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleOpenModal = (restaurant = null) => {
    if (restaurant) {
      setEditingRestaurant(restaurant);
      setFormData({
        name: restaurant.name || "",
        location: restaurant.location || "",
        cuisine: restaurant.cuisine || "",
        description: restaurant.description || "",
        opening_hours: restaurant.opening_hours || "",
        capacity: restaurant.capacity || 50,
        is_active: restaurant.is_active !== false
      });
    } else {
      setEditingRestaurant(null);
      setFormData({
        name: "",
        location: "",
        cuisine: "",
        description: "",
        opening_hours: "",
        capacity: 50,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRestaurant) {
        await adminAPI.updateRestaurant(editingRestaurant.id, formData);
      } else {
        await adminAPI.createRestaurant(formData);
      }
      setShowModal(false);
      fetchRestaurants();
    } catch (err) {
      alert('Error: ' + (err.message || "Failed to save restaurant"));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await adminAPI.deleteRestaurant(id);
        fetchRestaurants();
      } catch (err) {
        alert('Error: ' + (err.message || "Failed to delete restaurant"));
      }
    }
  };

  const handleToggleStatus = async (restaurant) => {
    try {
      await adminAPI.updateRestaurant(restaurant.id, {
        is_active: !restaurant.is_active
      });
      fetchRestaurants();
    } catch (err) {
      alert('Error: ' + (err.message || "Failed to update status"));
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading restaurants...</p>
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
          <h2>🏪 Restaurant Management</h2>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          + Add New Restaurant
        </Button>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Restaurant Stats */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-4">{restaurants.length}</Card.Title>
              <Card.Text>Total Restaurants</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-4 text-success">
                {restaurants.filter(r => r.is_active !== false).length}
              </Card.Title>
              <Card.Text>Active</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title className="display-4 text-secondary">
                {restaurants.filter(r => r.is_active === false).length}
              </Card.Title>
              <Card.Text>Inactive</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Restaurant Table */}
      <Card className="shadow-sm">
        <Card.Body>
          {restaurants.length === 0 ? (
            <div className="text-center text-muted py-4">
              <p className="mb-0">No restaurants found. Add one to get started!</p>
            </div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Cuisine</th>
                  <th>Capacity</th>
                  <th>Stats</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.location || '-'}</td>
                    <td>{r.cuisine || '-'}</td>
                    <td>{r.capacity || '-'}</td>
                    <td>
                      <small>
                        📅 {r.total_reservations || 0} | 
                        🛒 {r.total_orders || 0} | 
                        👤 {r.total_staff || 0}
                      </small>
                    </td>
                    <td>
                      <Badge bg={r.is_active !== false ? "success" : "secondary"}>
                        {r.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant={r.is_active !== false ? "outline-secondary" : "outline-success"} 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleToggleStatus(r)}
                      >
                        {r.is_active !== false ? "Disable" : "Enable"}
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleOpenModal(r)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(r.id)}
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
            {editingRestaurant ? "Edit Restaurant" : "Add New Restaurant"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cuisine Type</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.cuisine}
                    onChange={(e) => setFormData({...formData, cuisine: e.target.value})}
                    placeholder="e.g., Italian, Japanese, Chinese"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., New York, Manhattan"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Opening Hours</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.opening_hours}
                    onChange={(e) => setFormData({...formData, opening_hours: e.target.value})}
                    placeholder="e.g., 9:00 AM - 10:00 PM"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Capacity</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    min="1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.is_active ? "active" : "inactive"}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === "active"})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your restaurant..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingRestaurant ? "Update Restaurant" : "Add Restaurant"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
