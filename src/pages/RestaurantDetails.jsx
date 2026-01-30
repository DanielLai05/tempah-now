// RestaurantDetails.jsx
import React, { useContext, useState, useEffect } from "react";
import { Container, Card, Button, Row, Col, Badge, ListGroup, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import { formatPrice } from "../utils/formatters";
import { useToast, ToastProvider } from "../components/Toast";
import { menuAPI, restaurantAPI } from "../services/api";
import { auth } from "../firebase";

import sushiImg from "../assets/restaurants/sushi.png";
import pastaImg from "../assets/restaurants/pasta.png";
import indianImg from "../assets/restaurants/indian.png";

// Get image for restaurant
const getRestaurantImage = (restaurant) => {
  if (restaurant.image_url) return restaurant.image_url;
  
  const name = (restaurant.name || '').toLowerCase();
  if (name.includes('sushi') || name.includes('japanese')) {
    return sushiImg;
  } else if (name.includes('pasta') || name.includes('italian')) {
    return pastaImg;
  } else if (name.includes('indian') || name.includes('spice')) {
    return indianImg;
  }
  
  return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80';
};

// Default menu item image
const getMenuItemImage = (item) => {
  if (item.image_url) return item.image_url;
  return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&q=80';
};

export default function RestaurantDetails() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get restaurant ID from URL
  const { selectedRestaurant, setSelectedRestaurant, cart, removeFromCart, updateCartQuantity, clearCart, addToCart } = useContext(AppContext);
  const { showToast, removeToast, toasts } = useToast();
  const [showCart, setShowCart] = useState(false);

  // Data states
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);

  // Check if cart has items from a different restaurant
  const cartRestaurantId = cart.length > 0 
    ? (cart[0].restaurantId || (cart[0].id ? parseInt(cart[0].id.split('-')[0]) : null))
    : null;
  
  const isDifferentRestaurant = cartRestaurantId && restaurantData && cartRestaurantId !== parseInt(id);

  // Fetch restaurant and menu data from API
  useEffect(() => {
    const fetchData = async () => {
      const restaurantId = parseInt(id);
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch restaurant, categories and items from API
        const [restaurant, catsData, itemsData] = await Promise.all([
          restaurantAPI.getById(restaurantId),
          menuAPI.getCategories(restaurantId),
          menuAPI.getItems(restaurantId)
        ]);

        if (restaurant) {
          setRestaurantData(restaurant);
          setSelectedRestaurant(restaurant);
        }

        if (catsData && catsData.length > 0) {
          setCategories(catsData);
        }
        
        if (itemsData && itemsData.length > 0) {
          setMenuItems(itemsData);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load restaurant. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, setSelectedRestaurant]);

  // If no restaurant data found after loading
  if (!loading && !restaurantData && !selectedRestaurant) {
    return (
      <>
        <Navbar />
        <Container className="my-5 text-center">
          <h4>Restaurant not found</h4>
          <p className="text-muted">Please select a restaurant from Home page.</p>
          <Button
            style={{ background: "linear-gradient(90deg,#FF7E5F,#FEB47B)", border: "none" }}
            onClick={() => navigate("/home")}
          >
            Back to Home
          </Button>
        </Container>
      </>
    );
  }

  // If user has items from different restaurant, show warning
  if (isDifferentRestaurant) {
    return (
      <Container className="my-5">
        <div className="alert alert-warning text-center" role="alert">
          <h4 className="alert-heading">Different Restaurant Detected!</h4>
          <p>
            You have items from another restaurant in your cart. 
            Please clear your cart first to order from {restaurantData?.name || selectedRestaurant?.name}.
          </p>
          <hr />
          <div className="d-flex justify-content-center gap-2">
            <Button
              variant="danger"
              onClick={() => {
                clearCart();
              }}
            >
              Clear Cart & Start New Order
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/home")}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  const currentRestaurant = restaurantData || selectedRestaurant;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Group items by category
  const getItemsByCategory = (categoryName) => {
    return menuItems.filter(item => item.category_name === categoryName);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <Container className="my-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading menu...</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastProvider toasts={toasts} removeToast={removeToast} />
    <Container 
      fluid
      className="py-5 px-4" 
      style={{ 
        marginRight: cart.length > 0 && showCart ? "350px" : "0", 
        transition: "margin-right 0.3s ease",
        maxWidth: cart.length > 0 && showCart ? "calc(100% - 350px)" : "100%"
      }}
    >
      <Row className="justify-content-center">
        <Col xl={11} xxl={10}>
          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
              <Button variant="link" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          )}

          {/* Restaurant Header */}
          <Card className="mb-4 shadow-sm border-0 rounded-4 overflow-hidden">
            <div
              style={{
                background: `url('${getRestaurantImage(currentRestaurant)}') center/cover no-repeat`,
                height: "350px",
                width: "100%",
              }}
            />
            <Card.Body className="text-center py-4">
              <h2 className="fw-bold mb-2">{currentRestaurant?.name}</h2>
              <p className="text-muted mb-3">
                {currentRestaurant?.cuisine_type || 'Various'} • {currentRestaurant?.address?.split(',')[0] || currentRestaurant?.location || 'View on map'}
              </p>
              <p className="text-muted small">
                🕐 {currentRestaurant?.opening_time?.substring(0, 5) || '11:00'} - {currentRestaurant?.closing_time?.substring(0, 5) || '22:00'}
              </p>
            </Card.Body>
          </Card>

          {/* Menu by Categories */}
          {categories.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No menu categories available.</p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No menu items available yet.</p>
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = getItemsByCategory(category.category_name);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category.id} className="mb-5">
                  <h3 className="mb-4 fw-bold">{category.category_name}</h3>
                  <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                    {categoryItems.map((item) => {
                      const uniqueId = `${id}-${item.id}`;
                      const cartItem = cart.find((c) => c.id === uniqueId);
                      const quantityInCart = cartItem ? cartItem.quantity : 0;

                      return (
                        <Col key={item.id}>
                          <Card
                            className="h-100 border-0 shadow-sm"
                            style={{
                              borderRadius: "16px",
                              cursor: "pointer",
                              transition: "transform 0.25s, box-shadow 0.25s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.03)";
                              e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.08)";
                            }}
                          >
                            <div
                              style={{
                                background: `url('${getMenuItemImage(item)}') center/cover no-repeat`,
                                height: "180px",
                                borderTopLeftRadius: "16px",
                                borderTopRightRadius: "16px",
                              }}
                            />
                            <Card.Body className="d-flex flex-column">
                              <h5 className="fw-bold mb-2">{item.item_name}</h5>
                              <p className="text-muted small mb-2" style={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {item.description || ''}
                              </p>
                              <p className="mb-2 text-primary fw-semibold fs-5">{formatPrice(parseFloat(item.price))}</p>
                              {quantityInCart > 0 && (
                                <p className="text-muted small mb-2">In Cart: {quantityInCart}</p>
                              )}
                              <Button
                                className="mt-auto"
                                style={{
                                  background: "linear-gradient(90deg,#FF7E5F,#FEB47B)",
                                  border: "none",
                                }}
                                onClick={() => {
                                  if (!auth.currentUser) {
                                    showToast("Please login to add items to cart", "warning");
                                    navigate("/login");
                                    return;
                                  }

                                  const cartItemData = {
                                    id: `${id}-${item.id}`,
                                    menuItemId: item.id,
                                    name: item.item_name,
                                    price: parseFloat(item.price),
                                    image: getMenuItemImage(item),
                                    restaurantId: parseInt(id),
                                    description: item.description
                                  };

                                  addToCart(cartItemData, 1);
                                  showToast(`${item.item_name} added to cart!`, "success");
                                }}
                              >
                                Add to Cart
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              );
            })
          )}

          {/* Cart & Table Reservation */}
          <div className="mt-5">
        {cart.length > 0 && (
          <div className="mb-3 text-center">
            <h5 className="mb-2">Cart Summary</h5>
            <p className="text-muted mb-3">
              {cart.length} {cart.length === 1 ? "item" : "items"} in cart • Total: {formatPrice(subtotal)}
            </p>
            <Button
              variant="primary"
              className="me-2"
              onClick={() => navigate("/cart")}
            >
              View Cart ({cart.length})
            </Button>
            <Button
              variant="success"
              onClick={() => navigate("/reservation", { state: { restaurant: currentRestaurant, cart } })}
            >
              Proceed to Table Reservation
            </Button>
          </div>
        )}
        
        <div className="text-center">
          <Button
            variant="outline-primary"
            onClick={() =>
              navigate("/reservation", { state: { restaurant: currentRestaurant, cart: [] } })
            }
          >
            Book Table Only
          </Button>
        </div>
      </div>
        </Col>
      </Row>
    </Container>

    {/* Shopping Cart Sidebar */}
    {cart.length > 0 && showCart && (
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: "350px",
          height: "100vh",
          background: "#fff",
          boxShadow: "-4px 0 12px rgba(0,0,0,0.1)",
          zIndex: 1000,
          overflowY: "auto",
          padding: "20px",
          transition: "transform 0.3s ease",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-bold">Your Order</h5>
          <Button
            variant="link"
            className="p-0 text-muted"
            onClick={() => setShowCart(false)}
            style={{ fontSize: "1.5rem", lineHeight: "1" }}
          >
            <i className="bi bi-x-lg"></i>
          </Button>
        </div>

        <ListGroup variant="flush" className="mb-3">
          {cart.map((item) => (
            <ListGroup.Item
              key={item.id}
              className="px-0 py-3 border-bottom"
            >
              <div className="d-flex align-items-center mb-2">
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "8px",
                    background: `url('${item.image || getMenuItemImage({})}') center/cover no-repeat`,
                    marginRight: "12px",
                  }}
                />
                <div className="flex-grow-1">
                  <div className="fw-bold" style={{ fontSize: "0.9rem" }}>
                    {item.name}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                    {formatPrice(item.price)}
                  </div>
                </div>
                <Button
                  variant="link"
                  className="p-0 text-danger"
                  onClick={() => removeFromCart(item.id)}
                  style={{ fontSize: "1.2rem" }}
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </div>
              <div className="d-flex align-items-center justify-content-between mt-2">
                <div className="d-flex align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    style={{ width: "30px", height: "30px", padding: 0 }}
                  >
                    -
                  </Button>
                  <span className="mx-3 fw-bold">{item.quantity}</span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    style={{ width: "30px", height: "30px", padding: 0 }}
                  >
                    +
                  </Button>
                </div>
                <div className="fw-bold">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <div className="border-top pt-3">
          <div className="d-flex justify-content-between mb-3">
            <span className="fw-bold">Subtotal:</span>
            <span className="fw-bold fs-5">{formatPrice(subtotal)}</span>
          </div>
          
          <Button
            variant="primary"
            className="w-100 mb-2"
            onClick={() => {
              navigate("/cart");
              setShowCart(false);
            }}
          >
            View Full Cart
          </Button>
          
          <Button
            variant="success"
            className="w-100"
            onClick={() => {
              navigate("/reservation", { 
                state: { restaurant: currentRestaurant, cart } 
              });
            }}
          >
            Proceed to Reservation
          </Button>
        </div>
      </div>
    )}

    {/* Floating Cart Button */}
    {cart.length > 0 && (
      <Button
        variant="primary"
        style={{
          position: "fixed",
          bottom: "30px",
          right: showCart ? "380px" : "30px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          zIndex: 999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          transition: "right 0.3s ease",
        }}
        onClick={() => setShowCart(!showCart)}
      >
        <i className="bi bi-cart-fill" style={{ fontSize: "1.5rem" }}></i>
        <Badge
          bg="danger"
          style={{
            position: "absolute",
            top: "-5px",
            right: "-5px",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
          }}
        >
          {cart.length}
        </Badge>
      </Button>
    )}
    </>
  );
}
