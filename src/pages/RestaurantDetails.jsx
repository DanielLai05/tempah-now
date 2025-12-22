// src/pages/RestaurantDetails.jsx
import React, { useContext } from "react";
import { Container, Card, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

import sushiRollImg from "../assets/menu/sushi-roll.png";
import ramenImg from "../assets/menu/ramen.png";

// 示例菜单
const menuItems = [
  { id: 1, name: "Sushi Roll", price: 25, image: sushiRollImg },
  { id: 2, name: "Ramen", price: 18, image: ramenImg }
];

export default function RestaurantDetails() {
  const navigate = useNavigate();
  const { selectedRestaurant, addToCart, cart } = useContext(AppContext);

  console.log("selectedRestaurant:", selectedRestaurant);
  console.log("cart:", cart);

  if (!selectedRestaurant) {
    return (
      <Container className="my-5">
        <p>Please select a restaurant from Home page.</p>
        <Button variant="primary" onClick={() => navigate("/home")}>
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      {/* 餐厅信息 */}
      <Card className="mb-4 shadow-sm">
        <div
          style={{
            background: `url('${selectedRestaurant.image}') center / cover no-repeat`,
            height: "250px",
            borderTopLeftRadius: "6px",
            borderTopRightRadius: "6px"
          }}
        />
        <Card.Body>
          <h2>{selectedRestaurant.name}</h2>
          <p>{selectedRestaurant.cuisine} - {selectedRestaurant.location}</p>
        </Card.Body>
      </Card>

      {/* 菜单列表 */}
      <h3>Menu</h3>
      <Row>
        {menuItems.map(item => {
          // 获取当前 cart 中该菜品数量
          const cartItem = cart.find(c => c.id === item.id);
          const quantityInCart = cartItem ? cartItem.quantity : 0;

          return (
            <Col md={6} key={item.id}>
              <Card className="mb-4 shadow-sm">
                <div style={{
                  background: `url('${item.image}') center / cover no-repeat`,
                  height: "150px",
                  borderTopLeftRadius: "6px",
                  borderTopRightRadius: "6px"
                }} />
                <Card.Body>
                  <h5>{item.name} - ${item.price}</h5>
                  <p>In Cart: {quantityInCart}</p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      addToCart(item, 1);
                      console.log("Added to cart:", item);
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

      {/* Go to Cart */}
      <Button
        variant="success"
        onClick={() => navigate("/cart")}
      >
        Go to Cart
      </Button>
    </Container>
  );
}
