// AddRestaurant.jsx - Add/Edit Restaurant Page
import React, { useState, useEffect, useContext, useRef } from "react";
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext";
import { adminAPI } from "../../services/api";
import { uploadImage } from "../../services/fileUpload";

export default function AddRestaurant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearRole, userRole } = useContext(RoleContext);
  const formRef = useRef(null);

  // Check if editing existing restaurant
  const editingRestaurant = location.state?.restaurant || null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    cuisine: "",
    description: "",
    opening_time: "09:00",
    closing_time: "22:00",
    capacity: 50,
    is_active: true,
    image_url: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate("/staff/dashboard");
    }
  }, [userRole, navigate]);

  // Load existing restaurant data if editing
  useEffect(() => {
    if (editingRestaurant) {
      // Parse opening hours if it exists
      let openTime = "09:00";
      let closeTime = "22:00";

      if (editingRestaurant.opening_time && editingRestaurant.closing_time) {
        openTime = editingRestaurant.opening_time.substring(0, 5);
        closeTime = editingRestaurant.closing_time.substring(0, 5);
      }

      setFormData({
        name: editingRestaurant.name || "",
        email: editingRestaurant.email || "",
        phone: editingRestaurant.phone || "",
        location: editingRestaurant.location || editingRestaurant.address || "",
        cuisine: editingRestaurant.cuisine || editingRestaurant.cuisine_type || "",
        description: editingRestaurant.description || "",
        opening_time: openTime,
        closing_time: closeTime,
        capacity: editingRestaurant.capacity || editingRestaurant.max_capacity || 50,
        is_active: editingRestaurant.is_active !== false,
        image_url: editingRestaurant.image_url || ""
      });
      setImagePreview(editingRestaurant.image_url || null);
    }
  }, [editingRestaurant]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("File size too large. Maximum size is 5MB.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number format
  const validatePhone = (phone) => {
    // Allow various phone formats: +1-555-1234, +1 555 1234, 555-1234, etc.
    const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3,4}[-\s\.]?[0-9]{3,6}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Validate all fields
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Restaurant name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    if (!formData.location.trim()) {
      errors.location = "Location is required";
    }

    if (!formData.cuisine.trim()) {
      errors.cuisine = "Cuisine type is required";
    }

    if (!formData.capacity || formData.capacity < 1) {
      errors.capacity = "Capacity must be at least 1";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run validation
    if (!validateForm()) {
      // Scroll to the first invalid input
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField && formRef.current) {
        const invalidInput = formRef.current.querySelector(`[name="${firstErrorField}"]`);
        if (invalidInput) {
          invalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          invalidInput.focus();
        }
      }
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Upload image if a new file was selected
      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, "restaurants");
      }

      const restaurantData = {
        ...formData,
        image_url: imageUrl
      };

      if (editingRestaurant) {
        await adminAPI.updateRestaurant(editingRestaurant.id, restaurantData);
      } else {
        await adminAPI.createRestaurant(restaurantData);
      }

      navigate("/admin/restaurants");
    } catch (err) {
      setError(err.message || "Failed to save restaurant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="link" onClick={() => navigate("/admin/restaurants")}>
            <i className="bi bi-arrow-left me-2"></i>
            Back to Restaurants
          </Button>
          <h2 className="mt-2">
            <i className="bi bi-shop me-2"></i>
            {editingRestaurant ? "Edit Restaurant" : "Add New Restaurant"}
          </h2>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Form */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit} ref={formRef} noValidate>
            {/* Basic Information Section */}
            <div className="mb-4">
              <h6 className="text-uppercase text-muted mb-3 fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                <i className="bi bi-info-circle me-2"></i>Basic Information
              </h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      <i className="bi bi-shop me-1 text-primary"></i>
                      Restaurant Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({...formData, name: e.target.value});
                        if (validationErrors.name) {
                          setValidationErrors({...validationErrors, name: null});
                        }
                      }}
                      required
                      placeholder="Enter restaurant name"
                      className={`py-2 ${validationErrors.name ? 'is-invalid' : ''}`}
                      isInvalid={!!validationErrors.name}
                    />
                    {validationErrors.name && (
                      <Form.Control.Feedback type="invalid">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {validationErrors.name}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      <i className="bi bi-utensils me-1 text-primary"></i>
                      Cuisine Type *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="cuisine"
                      value={formData.cuisine}
                      onChange={(e) => {
                        setFormData({...formData, cuisine: e.target.value});
                        if (validationErrors.cuisine) {
                          setValidationErrors({...validationErrors, cuisine: null});
                        }
                      }}
                      placeholder="e.g., Italian, Japanese, Chinese"
                      required
                      className={`py-2 ${validationErrors.cuisine ? 'is-invalid' : ''}`}
                      isInvalid={!!validationErrors.cuisine}
                    />
                    {validationErrors.cuisine && (
                      <Form.Control.Feedback type="invalid">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {validationErrors.cuisine}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <hr className="my-4" style={{ opacity: 0.1 }} />

            {/* Contact Information Section */}
            <div className="mb-4">
              <h6 className="text-uppercase text-muted mb-3 fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                <i className="bi bi-telephone me-2"></i>Contact Information
              </h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      <i className="bi bi-envelope me-1 text-primary"></i>
                      Email *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="email"
                      value={formData.email || ""}
                      onChange={(e) => {
                        setFormData({...formData, email: e.target.value});
                        if (validationErrors.email) {
                          setValidationErrors({...validationErrors, email: null});
                        }
                      }}
                      placeholder="restaurant@example.com"
                      required
                      className={`py-2 ${validationErrors.email ? 'is-invalid' : ''}`}
                      isInvalid={!!validationErrors.email}
                    />
                    {validationErrors.email && (
                      <Form.Control.Feedback type="invalid">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {validationErrors.email}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      <i className="bi bi-phone me-1 text-primary"></i>
                      Phone *
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => {
                        setFormData({...formData, phone: e.target.value});
                        if (validationErrors.phone) {
                          setValidationErrors({...validationErrors, phone: null});
                        }
                      }}
                      placeholder="e.g., +1 555-1234"
                      required
                      className={`py-2 ${validationErrors.phone ? 'is-invalid' : ''}`}
                      isInvalid={!!validationErrors.phone}
                    />
                    {validationErrors.phone && (
                      <Form.Control.Feedback type="invalid">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {validationErrors.phone}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      <i className="bi bi-geo-alt me-1 text-primary"></i>
                      Location *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.location}
                      onChange={(e) => {
                        setFormData({...formData, location: e.target.value});
                        if (validationErrors.location) {
                          setValidationErrors({...validationErrors, location: null});
                        }
                      }}
                      placeholder="e.g., New York, Manhattan"
                      required
                      className={`py-2 ${validationErrors.location ? 'is-invalid' : ''}`}
                      isInvalid={!!validationErrors.location}
                    />
                    {validationErrors.location && (
                      <Form.Control.Feedback type="invalid">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {validationErrors.location}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <hr className="my-4" style={{ opacity: 0.1 }} />

            {/* Operating Hours Section */}
            <div className="mb-4">
              <h6 className="text-uppercase text-muted mb-3 fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                <i className="bi bi-clock me-2"></i>Operating Hours
              </h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      <i className="bi bi-clock-history me-1 text-primary"></i>
                      Opening Time *
                    </Form.Label>
                    <Form.Control
                      type="time"
                      value={formData.opening_time}
                      onChange={(e) => setFormData({...formData, opening_time: e.target.value})}
                      required
                      className="py-2"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      <i className="bi bi-clock-fill me-1 text-primary"></i>
                      Closing Time *
                    </Form.Label>
                    <Form.Control
                      type="time"
                      value={formData.closing_time}
                      onChange={(e) => setFormData({...formData, closing_time: e.target.value})}
                      required
                      className="py-2"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <hr className="my-4" style={{ opacity: 0.1 }} />

            {/* Additional Details Section */}
            <div className="mb-4">
              <h6 className="text-uppercase text-muted mb-3 fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                <i className="bi bi-three-dots me-2"></i>Additional Details
              </h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      <i className="bi bi-people me-1 text-primary"></i>
                      Capacity *
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => {
                        setFormData({...formData, capacity: parseInt(e.target.value) || 0});
                        if (validationErrors.capacity) {
                          setValidationErrors({...validationErrors, capacity: null});
                        }
                      }}
                      min="1"
                      required
                      className={`py-2 ${validationErrors.capacity ? 'is-invalid' : ''}`}
                      isInvalid={!!validationErrors.capacity}
                    />
                    {validationErrors.capacity && (
                      <Form.Control.Feedback type="invalid">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {validationErrors.capacity}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">
                      <i className="bi bi-toggle-on me-1 text-primary"></i>
                      Status
                    </Form.Label>
                    <Form.Select
                      value={formData.is_active ? "active" : "inactive"}
                      onChange={(e) => setFormData({...formData, is_active: e.target.value === "active"})}
                      className="py-2"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <hr className="my-4" style={{ opacity: 0.1 }} />

            {/* Image Upload Section */}
            <div className="mb-4">
              <h6 className="text-uppercase text-muted mb-3 fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
                <i className="bi bi-image me-2"></i>Restaurant Image
              </h6>
              <div
                className="d-flex align-items-start gap-4 p-4 rounded-3"
                style={{ backgroundColor: '#f8f9fa', border: '2px dashed #dee2e6' }}
              >
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <div
                      className="position-relative overflow-hidden"
                      style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    >
                      <img
                        src={imagePreview}
                        alt="Restaurant preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0 m-1 d-flex align-items-center justify-content-center"
                        onClick={handleRemoveImage}
                        style={{
                          width: '28px',
                          height: '28px',
                          padding: 0,
                          borderRadius: '50%',
                          fontSize: '14px'
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '150px',
                        height: '150px',
                        border: '2px dashed #ced4da',
                        borderRadius: '12px',
                        backgroundColor: '#fff'
                      }}
                    >
                      <i className="bi bi-image" style={{ fontSize: '3rem', color: '#adb5bd' }}></i>
                    </div>
                  )}
                </div>
                <div className="flex-grow-1 d-flex flex-column justify-content-center">
                  <Form.Control
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="mb-2"
                  />
                  <Form.Text className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Supported formats: JPEG, PNG, GIF, WebP. Maximum size: 5MB.
                  </Form.Text>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">
                <i className="bi bi-text-paragraph me-1 text-primary"></i>
                Description
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe your restaurant, cuisine, atmosphere..."
                className="py-2"
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </Form.Group>

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-3 pt-4 border-top">
              <Button
                variant="outline-secondary"
                onClick={() => navigate("/admin/restaurants")}
                className="px-4"
              >
                <i className="bi bi-x-lg me-2"></i>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={saving}
                className="px-4"
                style={{
                  background: 'linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)',
                  border: 'none'
                }}
              >
                {saving ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    {editingRestaurant ? "Update Restaurant" : "Add Restaurant"}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
