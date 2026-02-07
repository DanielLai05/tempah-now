// AdminRestaurants.jsx - Restaurant Management for Admin
import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Card, Badge, Button, Table, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { adminAPI } from "../../services/api";
import { deleteImage } from "../../services/fileUpload";
import { ConfirmDialog } from "../../components/ConfirmDialog";

export default function AdminRestaurants() {
  const navigate = useNavigate();
  const { clearRole, userRole } = useContext(RoleContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = (restaurant) => {
    setRestaurantToDelete(restaurant);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!restaurantToDelete) return;
    setDeleting(true);
    try {
      // First delete the image from Firebase Storage if it exists
      if (restaurantToDelete.image_url) {
        await deleteImage(restaurantToDelete.image_url);
      }

      // Then delete the restaurant from the database
      await adminAPI.deleteRestaurant(restaurantToDelete.id);
      fetchRestaurants();
    } catch (err) {
      alert('Error: ' + (err.message || "Failed to delete restaurant"));
    } finally {
      setShowDeleteDialog(false);
      setRestaurantToDelete(null);
      setDeleting(false);
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
    <>
      <Container className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <Button variant="link" onClick={() => navigate("/admin/dashboard")}>
              Back to Dashboard
            </Button>
            <h2>Restaurant Management</h2>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={handleLogout}>
              Logout
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate("/admin/restaurants/add")}
              style={{
                background: 'linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)',
                border: 'none'
              }}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Add New Restaurant
            </Button>
          </div>
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
                    <th>Image</th>
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
                      <td>
                        {r.image_url ? (
                          <img
                            src={r.image_url}
                            alt={r.name}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '8px',
                              backgroundColor: '#f0f0f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className="bi bi-shop text-muted"></i>
                          </div>
                        )}
                      </td>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.location || '-'}</td>
                      <td>{r.cuisine || '-'}</td>
                      <td>{r.capacity || '-'}</td>
                      <td>
                        <div className="d-flex gap-3">
                          <div className="text-center">
                            <div className="fw-bold">{r.total_reservations || 0}</div>
                            <small className="text-muted">Reservations</small>
                          </div>
                          <div className="text-center">
                            <div className="fw-bold">{r.total_orders || 0}</div>
                            <small className="text-muted">Orders</small>
                          </div>
                          <div className="text-center">
                            <div className="fw-bold">{r.total_staff || 0}</div>
                            <small className="text-muted">Staff</small>
                          </div>
                        </div>
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
                          onClick={() => navigate("/admin/restaurants/edit/" + r.id, { state: { restaurant: r } })}
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(r)}
                        >
                          <i className="bi bi-trash me-1"></i>
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
      </Container>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        show={showDeleteDialog}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setRestaurantToDelete(null);
        }}
        title="Delete Restaurant"
        message={restaurantToDelete ? `Are you sure you want to delete "${restaurantToDelete.name}"? This action cannot be undone.` : "Are you sure you want to delete this restaurant?"}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
