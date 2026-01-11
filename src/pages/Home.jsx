// Home.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context";
import { AppContext } from "../context/AppContext.jsx";
import { auth } from "../firebase";
import Navbar from "../components/Navbar";
import { useConfirmDialog } from "../components/ConfirmDialog";
import { formatPrice } from "../utils/formatters";

import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  InputGroup,
  Carousel,
} from "react-bootstrap";

import sushiImg from "../assets/restaurants/sushi.png";
import pastaImg from "../assets/restaurants/pasta.png";
import indianImg from "../assets/restaurants/indian.png";

const restaurants = [
  {
    id: 1,
    name: "Sushi Hana",
    cuisine: "Japanese",
    location: "KL",
    image: sushiImg,
    rating: 4.8,
    popular: true,
    discount: "10% Off",
    priceRange: [20, 60],
  },
  {
    id: 2,
    name: "La Pasta",
    cuisine: "Italian",
    location: "PJ",
    image: pastaImg,
    rating: 4.3,
    popular: false,
    discount: null,
    priceRange: [15, 50],
  },
  {
    id: 3,
    name: "Spice Route",
    cuisine: "Indian",
    location: "Subang Jaya",
    image: indianImg,
    rating: 4.6,
    popular: true,
    discount: "15% Off",
    priceRange: [10, 40],
  },
  {
    id: 4,
    name: "168 Ban Mian",
    cuisine: "Chinese",
    location: "Kepong",
    image: 'https://lh3.googleusercontent.com/gps-cs-s/AG0ilSxPgdA97GBJgiopGu5o1yzgtJbJsLMGOOeKvhJK0FJ-ydO7ZWbYn2wPwEC3M4Q6N_ciIyBa8Adsgho2_1gS1zOe9sQW8qFxh4usb2YgfdewPS0dzR18uB-hv60Q9AE8W7RTtHTC=s1360-w1360-h1020-rw',
    rating: 5.0,
    popular: true,
    discount: "15% Off",
    priceRange: [10, 40],
  },
];

const cuisines = ["All", "Japanese", "Italian", "Indian"];
const locations = ["All", "KL", "PJ", "Subang Jaya"];

export default function Home() {
  const { currentUser } = useContext(AuthContext);
  const { setSelectedRestaurant, cart, clearCart } = useContext(AppContext);
  const navigate = useNavigate();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const [search, setSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 100]);

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  const handleSelectRestaurant = async (r) => {
    // Check if cart has items from a different restaurant
    if (cart.length > 0) {
      // Get the restaurant ID from the first item in cart (format: "restaurantId-itemId")
      const firstCartItem = cart[0];
      const cartRestaurantId = firstCartItem.restaurantId || (firstCartItem.id ? parseInt(firstCartItem.id.split('-')[0]) : null);
      
      // If trying to select a different restaurant
      if (cartRestaurantId && cartRestaurantId !== r.id) {
        const confirmed = await confirm({
          title: "Different Restaurant",
          message: `You have items from another restaurant in your cart. Would you like to clear your cart and start a new order at ${r.name}?`,
          confirmText: "Clear & Continue",
          cancelText: "Cancel",
          variant: "warning"
        });
        
        if (confirmed) {
          clearCart();
          setSelectedRestaurant(r);
          navigate(`/restaurant-details/${r.id}`);
        }
        return; // Don't proceed if user cancels
      }
    }
    
    setSelectedRestaurant(r);
    navigate(`/restaurant-details/${r.id}`);
  };

  // Filter logic
  const filtered = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase());

    const matchesCuisine = selectedCuisine === "All" || r.cuisine === selectedCuisine;
    const matchesLocation = selectedLocation === "All" || r.location === selectedLocation;
    const matchesPrice =
      r.priceRange[0] >= priceRange[0] && r.priceRange[1] <= priceRange[1];

    return matchesSearch && matchesCuisine && matchesLocation && matchesPrice;
  });

  const recommended = restaurants.filter((r) => r.popular);

  return (
    <div style={{ backgroundColor: "#F1F3F6", minHeight: "100vh" }}>
      <Navbar />
      <ConfirmDialogComponent />
      <Container className="py-5">
        <div className="mb-4">
          <h1 className="fw-bold">Discover Restaurants</h1>
          <p className="text-muted">Find your perfect dining experience</p>
        </div>

        {/* Recommended Carousel */}
        {recommended.length > 0 && (
          <Carousel className="mb-4 shadow-sm rounded">
            {recommended.map((r) => (
              <Carousel.Item key={r.id}>
                <div
                  style={{
                    height: "250px",
                    background: `url('${r.image}') center/cover no-repeat`,
                    borderRadius: "12px",
                  }}
                />
                <Carousel.Caption>
                  <h5>{r.name}</h5>
                  <p>{r.cuisine} • {r.location} • ⭐ {r.rating}</p>
                </Carousel.Caption>
              </Carousel.Item>
            ))}
          </Carousel>
        )}

        {/* Search + Filter */}
        <Row className="mb-4 g-2 align-items-center">
          <Col md={4}>
            <InputGroup>
              <Form.Control
                placeholder="Search by name, cuisine, location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button variant="primary">Search</Button>
            </InputGroup>
          </Col>
          <Col md={2}>
            <Form.Select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
            >
              {cuisines.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}</Form.Label>
            <Form.Range
              min={0}
              max={100}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, Number(e.target.value)])}
            />
          </Col>
        </Row>

        {/* Restaurant Cards */}
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {filtered.map((r) => (
            <Col key={r.id}>
              <Card
                className="h-100 border-0"
                style={{
                  cursor: "pointer",
                  borderRadius: "12px",
                  transition: "transform 0.25s, box-shadow 0.25s",
                }}
                onClick={() => handleSelectRestaurant(r)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.08)";
                }}
              >
                <div
                  style={{
                    background: `url('${r.image}') center/cover no-repeat`,
                    height: "180px",
                    borderTopLeftRadius: "12px",
                    borderTopRightRadius: "12px",
                  }}
                />
                <Card.Body className="bg-white rounded-bottom shadow-sm">
                  <Card.Title className="fw-bold">{r.name}</Card.Title>
                  <div className="mb-1">
                    <Badge bg="info" className="me-1">{r.cuisine}</Badge>
                    <span className="text-muted small">{r.location}</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-warning">⭐ {r.rating}</span>{" "}
                    {r.popular && <Badge bg="danger">Popular</Badge>}{" "}
                    {r.discount && <Badge bg="success">{r.discount}</Badge>}
                  </div>
                  <Button
                    style={{
                      background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
                      border: "none",
                    }}
                    size="sm"
                  >
                    View Details
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {filtered.length === 0 && (
          <p className="text-center text-muted mt-5">No restaurants found.</p>
        )}
      </Container>
    </div>
  );
}
