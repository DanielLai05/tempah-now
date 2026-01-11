// RestaurantDetails.jsx
import React, { useContext, useState } from "react";
import { Container, Card, Button, Row, Col, Badge, ListGroup, Offcanvas } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import { formatPrice } from "../utils/formatters";
import { useToast, ToastProvider } from "../components/Toast";

import sushiRollImg from "../assets/menu/sushi-roll.png";
import ramenImg from "../assets/menu/ramen.png";
import sushiImg from "../assets/restaurants/sushi.png";
import pastaImg from "../assets/restaurants/pasta.png";
import indianImg from "../assets/restaurants/indian.png";

const menuItems = [
  { id: 1, name: "Sushi Roll", price: 25, image: sushiRollImg },
  { id: 2, name: "Ramen", price: 18, image: ramenImg },
];

export default function RestaurantDetails() {
  const navigate = useNavigate();
  const { selectedRestaurant, addToCart, cart, removeFromCart, updateCartQuantity, clearCart } = useContext(AppContext);
  const [showCart, setShowCart] = useState(false);
  const { showToast, removeToast, toasts } = useToast();

  // Check if cart has items from a different restaurant
  const cartRestaurantId = cart.length > 0 
    ? (cart[0].restaurantId || (cart[0].id ? parseInt(cart[0].id.split('-')[0]) : null))
    : null;
  
  const isDifferentRestaurant = cartRestaurantId && cartRestaurantId !== selectedRestaurant?.id;

  if (!selectedRestaurant) {
    return (
      <Container className="my-5 text-center">
        <p>Please select a restaurant from Home page.</p>
        <Button
          style={{ background: "linear-gradient(90deg,#FF7E5F,#FEB47B)", border: "none" }}
          onClick={() => navigate("/home")}
        >
          Back to Home
        </Button>
      </Container>
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
            Please clear your cart first to order from {selectedRestaurant.name}.
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Get menu items based on restaurant with unique food images
  // Each item gets a unique ID: restaurantId-itemId to avoid conflicts
  const getMenuItems = (restaurantId) => {
    const createItem = (itemId, name, price, image) => ({
      id: `${restaurantId}-${itemId}`, // Unique ID: restaurantId-itemId
      name,
      price,
      image,
      restaurantId, // Store restaurant ID for reference
    });

    switch(restaurantId) {
      case 1: // Sushi Hana - Japanese
        return [
          createItem(1, "Salmon Sashimi", 35, "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&q=80"),
          createItem(2, "Tuna Roll", 28, "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=300&fit=crop&q=80"),
          createItem(3, "Dragon Roll", 42, "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop&q=80"),
          createItem(4, "Miso Soup", 12, "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80"),
          createItem(5, "Tempura Udon", 32, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&q=80"),
        ];
      case 2: // La Pasta - Italian
        return [
          createItem(1, "Spaghetti Carbonara", 38, "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop&q=80"),
          createItem(2, "Margherita Pizza", 45, "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop&q=80"),
          createItem(3, "Lasagna", 42, "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=300&fit=crop&q=80"),
          createItem(4, "Caesar Salad", 25, "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop&q=80"),
        ];
      case 3: // Spice Route - Indian
        return [
          createItem(1, "Butter Chicken", 28, "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&q=80"),
          createItem(2, "Biryani", 32, "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop&q=80"),
          createItem(3, "Naan Bread", 8, "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop&q=80"),
          createItem(4, "Tandoori Chicken", 35, "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&q=80"),
        ];
      case 4: // 168 Ban Mian - Chinese
        return [
          createItem(1, "Ban Mian (Handmade Noodles)", 12, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&q=80"),
          createItem(2, "Dry Noodles", 14, "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop&q=80"),
          createItem(3, "Wonton Noodles", 16, "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&q=80"),
          createItem(4, "Char Kway Teow", 15, "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&h=300&fit=crop&q=80"),
        ];
      default:
        return [
          { id: "default-1", name: "Sushi Roll", price: 25, image: sushiRollImg, restaurantId: 0 },
          { id: "default-2", name: "Ramen", price: 18, image: ramenImg, restaurantId: 0 },
        ];
    }
  };

  const menuItems = getMenuItems(selectedRestaurant?.id);

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
          {/* Restaurant Header */}
          <Card className="mb-4 shadow-sm border-0 rounded-4 overflow-hidden">
            <div
              style={{
                background: `url('${selectedRestaurant.image}') center / cover no-repeat`,
                height: "350px",
                width: "100%",
              }}
            />
            <Card.Body className="text-center py-4">
              <h2 className="fw-bold mb-2">{selectedRestaurant.name}</h2>
              <p className="text-muted mb-3">
                {selectedRestaurant.cuisine} • {selectedRestaurant.location}
              </p>
              <div>
                {selectedRestaurant.popular && <Badge bg="danger" className="me-2">Popular</Badge>}
                {selectedRestaurant.discount && <Badge bg="success">{selectedRestaurant.discount}</Badge>}
              </div>
            </Card.Body>
          </Card>

          {/* Menu */}
          <div className="mb-4">
            <h3 className="mb-4 fw-bold">Menu</h3>
            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {menuItems.map((item) => {
          const cartItem = cart.find((c) => c.id === item.id);
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
                    background: `url('${item.image}') center/cover no-repeat`,
                    height: "180px",
                    borderTopLeftRadius: "16px",
                    borderTopRightRadius: "16px",
                  }}
                />
                <Card.Body className="d-flex flex-column">
                  <h5 className="fw-bold mb-2">{item.name}</h5>
                  <p className="mb-2 text-primary fw-semibold fs-5">{formatPrice(item.price)}</p>
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
                      addToCart(item, 1);
                      showToast(`${item.name} added to cart!`, "success");
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
              onClick={() => navigate("/table-reservation", { state: { restaurant: selectedRestaurant, cart } })}
            >
              Proceed to Table Reservation
            </Button>
          </div>
        )}
        
        <div className="text-center">
          <Button
            variant="outline-primary"
            onClick={() =>
              navigate("/table-reservation", { state: { restaurant: selectedRestaurant, cart: [] } })
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
                    background: `url('${item.image}') center/cover no-repeat`,
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
              navigate("/table-reservation", { 
                state: { restaurant: selectedRestaurant, cart } 
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
