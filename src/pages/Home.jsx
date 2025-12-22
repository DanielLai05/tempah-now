// src/pages/Home.jsx
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context';
import { AppContext } from '../context/AppContext.jsx'; // 注意加 .jsx
import { Button, Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { auth } from '../firebase';

// 餐厅图片（确保这些文件在 src/assets/restaurants/ 中）
import sushiImg from "../assets/restaurants/sushi.png";
import pastaImg from "../assets/restaurants/pasta.png";
import indianImg from "../assets/restaurants/indian.png";

// 餐厅列表
const restaurants = [
  { id: 1, name: "Sushi Hana", cuisine: "Japanese", location: "KL", image: sushiImg },
  { id: 2, name: "La Pasta", cuisine: "Italian", location: "PJ", image: pastaImg },
  { id: 3, name: "Spice Route", cuisine: "Indian", location: "Subang Jaya", image: indianImg }
];

export default function Home() {
  const { currentUser } = useContext(AuthContext);
  const { setSelectedRestaurant } = useContext(AppContext);
  const navigate = useNavigate();

  // 如果用户没登录，跳转到 /login
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    auth.signOut();
  };

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant); // 保存选中的餐厅
    navigate(`/restaurant-details/${restaurant.id}`); // 跳转到餐厅详情页
  };

  return (
    <Container className="my-5">
      <h1>Home</h1>
      <div className="mb-4">
        <Button onClick={handleLogout} className="mx-2">Logout</Button>
      </div>

      <h2>Restaurants</h2>
      <Row>
        {restaurants.map((r) => (
          <Col md={4} key={r.id}>
            <Card
              style={{ cursor: "pointer" }}
              onClick={() => handleSelectRestaurant(r)}
              className="mb-3 shadow-sm"
            >
              <div
                style={{
                  background: `url('${r.image}') center / cover no-repeat`,
                  height: "150px",
                  borderTopLeftRadius: "6px",
                  borderTopRightRadius: "6px"
                }}
              />
              <Card.Body>
                <Card.Title>{r.name}</Card.Title>
                <Badge bg="secondary">{r.cuisine}</Badge>
                <p className="text-muted">{r.location}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
