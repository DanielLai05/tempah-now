// Home.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context";
import { AppContext } from "../context/AppContext.jsx";
import Navbar from "../components/Navbar";
import { useConfirmDialog } from "../components/ConfirmDialog";
import { formatPrice } from "../utils/formatters";
import { restaurantAPI } from "../services/api";

import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  InputGroup,
  Spinner,
  Alert,
} from "react-bootstrap";

import sushiImg from "../assets/restaurants/sushi.png";
import pastaImg from "../assets/restaurants/pasta.png";
import indianImg from "../assets/restaurants/indian.png";

// Get static image for restaurant
const getRestaurantImage = (restaurant) => {
  // If restaurant has uploaded image URL, use it
  if (restaurant.image_url) return restaurant.image_url;

  // Otherwise, return local images based on restaurant name
  const name = (restaurant.name || '').toLowerCase();
  if (name.includes('sushi') || name.includes('japanese') || name.includes('sakura')) {
    return sushiImg;
  } else if (name.includes('pasta') || name.includes('italian') || name.includes('paradise')) {
    return pastaImg;
  } else if (name.includes('indian') || name.includes('spice') || name.includes('garden') || name.includes('curry')) {
    return indianImg;
  }

  // Default to sushi image
  return sushiImg;
};

export default function Home() {
  const { currentUser } = useContext(AuthContext);
  const { setSelectedRestaurant, cart, clearCart } = useContext(AppContext);
  const navigate = useNavigate();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const [search, setSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // Fetch restaurants from API
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await restaurantAPI.getAll();
        setRestaurants(data);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Failed to load restaurants. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const cuisines = ["All", ...new Set(restaurants.map(r => r.cuisine_type).filter(Boolean))];

  const handleSelectRestaurant = async (r) => {
    if (cart.length > 0) {
      const firstCartItem = cart[0];
      const cartRestaurantId = firstCartItem.restaurantId || (firstCartItem.id ? parseInt(firstCartItem.id.split('-')[0]) : null);

      if (cartRestaurantId && cartRestaurantId !== r.id) {
        confirm(
          "Clear Cart?",
          "Your cart contains items from another restaurant. Would you like to clear your cart?",
          "Clear",
          () => {
            clearCart();
            setSelectedRestaurant(r);
            navigate(`/restaurant-details/${r.id}`);
          }
        );
        return;
      }
    }

    setSelectedRestaurant(r);
    navigate(`/restaurant-details/${r.id}`);
  };

  // Filter restaurants based on search, cuisine, and price range
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = (restaurant.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
                         (restaurant.cuisine_type?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesCuisine = selectedCuisine === "All" || restaurant.cuisine_type === selectedCuisine;
    
    // Simple price range check (based on estimated avg price)
    const estimatedPrice = restaurant.price_range ? 
      (restaurant.price_range[0] + restaurant.price_range[1]) / 2 : 30;
    const matchesPrice = estimatedPrice >= priceRange[0] && estimatedPrice <= priceRange[1];
    
    return matchesSearch && matchesCuisine && matchesPrice;
  });

  return (
    <>
      <Navbar />
      <ConfirmDialogComponent />

      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)",
          color: "white",
          padding: "60px 0",
          textAlign: "center",
        }}
      >
        <Container>
          <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "1rem" }}>
            TempahNow
          </h1>
          <p style={{ fontSize: "1.25rem", marginBottom: "2rem", opacity: 0.9 }}>
            Reserve tables and order food from your favorite restaurants
          </p>

          {/* Search Bar */}
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <InputGroup size="lg" className="shadow-sm">
                <Form.Control
                  placeholder="Search restaurants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border: "none", padding: "15px" }}
                />
                <Button
                  variant="light"
                  style={{ padding: "15px 30px", fontWeight: "bold" }}
                >
                  <i className="bi bi-search"></i>
                </Button>
              </InputGroup>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Filter Section */}
      <Container className="my-4">
        <Row className="align-items-center">
          <Col md={6}>
            <div className="d-flex gap-2 flex-wrap">
              {cuisines.map((cuisine) => (
                <Button
                  key={cuisine}
                  variant={selectedCuisine === cuisine ? "primary" : "outline-secondary"}
                  onClick={() => setSelectedCuisine(cuisine)}
                  style={{
                    background: selectedCuisine === cuisine ? "linear-gradient(90deg, #FF7E5F, #FEB47B)" : undefined,
                    border: "none",
                  }}
                >
                  {cuisine}
                </Button>
              ))}
            </div>
          </Col>
          <Col md={6} className="text-md-end mt-3 mt-md-0">
            <span className="text-muted me-2">Showing</span>
            <strong>{filteredRestaurants.length}</strong>
            <span className="text-muted ms-1">restaurants</span>
          </Col>
        </Row>
      </Container>

      {/* Restaurant Grid */}
      <Container className="pb-5">
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading restaurants...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" className="text-center">
            {error}
            <Button variant="link" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Alert>
        )}

        {!loading && !error && filteredRestaurants.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-search" style={{ fontSize: "3rem", color: "#ccc" }}></i>
            <p className="mt-3 text-muted">No restaurants found matching your criteria</p>
          </div>
        )}

        {!loading && !error && (
          <Row xs={1} sm={2} lg={4} className="g-4">
            {filteredRestaurants.map((restaurant) => (
              <Col key={restaurant.id}>
                <Card
                  className="h-100 cursor-pointer border-0 shadow-sm"
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
                  onClick={() => handleSelectRestaurant(restaurant)}
                >
                  <div
                    style={{
                      backgroundImage: `url(${getRestaurantImage(restaurant)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      height: "180px",
                      borderTopLeftRadius: "16px",
                      borderTopRightRadius: "16px",
                      position: "relative",
                    }}
                  >
                    {restaurant.discount && (
                      <Badge
                        bg="danger"
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          fontSize: "0.75rem",
                        }}
                      >
                        {restaurant.discount}
                      </Badge>
                    )}
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="mb-0 fw-bold" style={{ fontSize: "1.1rem" }}>
                        {restaurant.name}
                      </Card.Title>
                      {restaurant.rating && (
                        <Badge bg="warning" text="dark" className="ms-2">
                          <i className="bi bi-star-fill me-1"></i>
                          {restaurant.rating}
                        </Badge>
                      )}
                    </div>
                    <Card.Text className="text-muted small mb-2">
                      {restaurant.cuisine_type} • {restaurant.address?.split(',')[0] || restaurant.location}
                    </Card.Text>
                    <div className="d-flex align-items-center mt-auto">
                      <Button
                        variant="primary"
                        className="flex-grow-1"
                        style={{
                          background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
                          border: "none",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRestaurant(restaurant);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
}
