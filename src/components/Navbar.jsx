// Unified Navigation Bar Component
import React, { useContext, useState } from "react";
import { Navbar as BSNavbar, Nav, Badge, Dropdown, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context";
import { AppContext } from "../context/AppContext";
import { auth } from "../firebase";

export default function Navbar() {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { cart } = useContext(AppContext);
  const [expanded, setExpanded] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const cartItemCount = cart?.length || 0;

  return (
    <BSNavbar
      expand="lg"
      className="bg-white shadow-sm"
      style={{ borderBottom: "1px solid #e0e0e0" }}
      expanded={expanded}
    >
      <Container>
        <BSNavbar.Brand
          onClick={() => navigate("/home")}
          style={{
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1.5rem",
            background: "linear-gradient(90deg, #FF7E5F, #FEB47B)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          TempahNow
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(!expanded)}
        />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={() => { navigate("/home"); setExpanded(false); }}>
              Home
            </Nav.Link>
          </Nav>
          
          <Nav className="d-flex align-items-center gap-3">
            {/* Cart Icon */}
            <div
              onClick={() => {
                navigate("/cart");
                setExpanded(false);
              }}
              style={{
                cursor: "pointer",
                position: "relative",
                padding: "8px 12px",
                borderRadius: "8px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <i className="bi bi-cart-fill" style={{ fontSize: "1.5rem", color: "#FF7E5F" }}></i>
              {cartItemCount > 0 && (
                <Badge
                  bg="danger"
                  style={{
                    position: "absolute",
                    top: "0",
                    right: "0",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                  }}
                >
                  {cartItemCount}
                </Badge>
              )}
            </div>

            {/* User Menu */}
            {currentUser && (
              <Dropdown>
                <Dropdown.Toggle
                  variant="link"
                  id="user-dropdown"
                  style={{
                    textDecoration: "none",
                    color: "#333",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <i className="bi bi-person-circle" style={{ fontSize: "1.5rem" }}></i>
                  <span className="d-none d-md-inline">
                    {currentUser.email?.split("@")[0] || "User"}
                  </span>
                </Dropdown.Toggle>

                <Dropdown.Menu align="end">
                  <Dropdown.ItemText>
                    <small className="text-muted">{currentUser.email}</small>
                  </Dropdown.ItemText>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

