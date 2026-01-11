// ShoppingCart.jsx
import React, { useContext } from "react";
import { Container, Row, Col, Card, Button, Badge, ListGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import { formatPrice } from "../utils/formatters";
import { useConfirmDialog } from "../components/ConfirmDialog";

export default function ShoppingCart() {
  const navigate = useNavigate();
  const { cart = [], clearCart, removeFromCart, updateCartQuantity } = useContext(AppContext);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  if (!cart || cart.length === 0) {
    return (
      <>
        <Navbar />
        <Container className="my-5 text-center" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛒</div>
          <h3 className="mb-3">Your cart is empty</h3>
          <p className="text-muted mb-4">Start adding items to your cart to see them here</p>
          <Button
            style={{ background: "linear-gradient(90deg,#FF7E5F,#FEB47B)", border: "none" }}
            onClick={() => navigate("/home")}
            size="lg"
          >
            Continue Shopping
          </Button>
        </Container>
      </>
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleClearCart = async () => {
    const confirmed = await confirm({
      title: "Clear Cart",
      message: "Are you sure you want to remove all items from your cart?",
      confirmText: "Clear All",
      cancelText: "Cancel",
      variant: "danger"
    });
    if (confirmed) {
      clearCart();
    }
  };

  return (
    <>
      <Navbar />
      <ConfirmDialogComponent />
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">Shopping Cart</h2>
          <Badge bg="info" style={{ fontSize: "1rem", padding: "8px 16px" }}>
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </Badge>
        </div>

        <Row>
          <Col lg={8}>
            <ListGroup className="mb-4">
              {cart.map((item) => (
                <ListGroup.Item
                  key={item.id}
                  className="p-0 mb-3 border-0"
                >
                  <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
                    <Card.Body className="p-3">
                      <Row className="align-items-center">
                        <Col xs={4} sm={3} md={2}>
                          <div
                            style={{
                              background: `url('${item.image}') center/cover no-repeat`,
                              height: "100px",
                              borderRadius: "8px",
                            }}
                          />
                        </Col>
                        <Col xs={8} sm={9} md={10}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h5 className="fw-bold mb-1">{item.name}</h5>
                              <p className="text-muted mb-2" style={{ fontSize: "0.9rem" }}>
                                {formatPrice(item.price)} each
                              </p>
                              
                              {/* Quantity Controls */}
                              <div className="d-flex align-items-center gap-3 mb-2">
                                <span className="text-muted small">Quantity:</span>
                                <div className="d-flex align-items-center gap-2">
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                    style={{ width: "32px", height: "32px", padding: 0 }}
                                  >
                                    -
                                  </Button>
                                  <Badge bg="info" style={{ minWidth: "40px", padding: "6px 12px" }}>
                                    {item.quantity}
                                  </Badge>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                    style={{ width: "32px", height: "32px", padding: 0 }}
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="fw-bold text-primary">
                                {formatPrice(item.price * item.quantity)}
                              </div>
                            </div>
                            
                            <Button
                              variant="link"
                              className="text-danger p-0 ms-2"
                              onClick={() => removeFromCart(item.id)}
                              style={{ fontSize: "1.2rem" }}
                              title="Remove item"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm border-0 sticky-top" style={{ top: "20px", borderRadius: "12px" }}>
              <Card.Header className="bg-light">
                <h5 className="mb-0 fw-bold">Order Summary</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Subtotal ({cart.length} {cart.length === 1 ? "item" : "items"}):</span>
                  <span className="fw-bold">{formatPrice(subtotal)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4">
                  <span className="fw-bold fs-5">Total:</span>
                  <span className="fw-bold fs-5 text-primary">{formatPrice(subtotal)}</span>
                </div>
                
                <div className="d-grid gap-2">
                  <Button
                    style={{ background: "linear-gradient(90deg,#FF7E5F,#FEB47B)", border: "none" }}
                    size="lg"
                    onClick={() => {
                      if (cart.length > 0) {
                        // Get restaurant info from cart
                        const restaurantId = cart[0].restaurantId || (cart[0].id ? parseInt(cart[0].id.split('-')[0]) : null);
                        navigate("/table-reservation", { 
                          state: { 
                            restaurant: restaurantId ? { id: restaurantId } : null,
                            cart 
                          } 
                        });
                      }
                    }}
                  >
                    Proceed to Reservation
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate("/home")}
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
