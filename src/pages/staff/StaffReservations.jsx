import React, { useContext } from "react";
import { Container, Table, Button, Badge } from "react-bootstrap";
import { RoleContext } from "../../context/RoleContext";

// Restaurant list (should match with AdminStaff)
const restaurants = [
  { id: 1, name: "Sushi Hana" },
  { id: 2, name: "La Pasta" },
  { id: 3, name: "Spice Route" },
  { id: 4, name: "168 Ban Mian" },
];

export default function StaffReservations() {
  const { userRole, isManager, userRestaurantId } = useContext(RoleContext);
  
  // Get restaurant name from ID
  const restaurantName = userRestaurantId 
    ? restaurants.find(r => r.id === userRestaurantId)?.name || "Unknown Restaurant"
    : "All Restaurants";

  // All reservations (in production, this would be from database)
  const allReservations = [
    { id: 1, customer: "Alice", restaurant: "Sushi Hana", restaurantId: 1, date: "2025-12-22", time: "18:00", partySize: 4, seatNumber: "A1", status: "Confirmed" },
    { id: 2, customer: "Bob", restaurant: "La Pasta", restaurantId: 2, date: "2025-12-22", time: "19:00", partySize: 2, seatNumber: "B1", status: "Pending" },
    { id: 3, customer: "Charlie", restaurant: "Sushi Hana", restaurantId: 1, date: "2025-12-22", time: "20:00", partySize: 6, seatNumber: "B2", status: "Confirmed" },
  ];

  // Filter reservations by restaurant if userRestaurantId is set
  const reservations = userRestaurantId
    ? allReservations.filter(r => r.restaurantId === userRestaurantId)
    : allReservations;

  const handleUpdateStatus = (id, newStatus) => {
    alert(`Reservation ${id} status updated to ${newStatus}`);
  };

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Manage Reservations</h2>
          <p className="text-muted mb-0">
            Restaurant: <Badge bg="primary">{restaurantName}</Badge>
            {isManager && <Badge bg="success" className="ms-2">Manager</Badge>}
          </p>
        </div>
      </div>
      
      {reservations.length === 0 ? (
        <div className="alert alert-info text-center">
          <p className="mb-0">No reservations found for {restaurantName}.</p>
        </div>
      ) : (
        <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Restaurant</th>
            <th>Date</th>
            <th>Time</th>
            <th>Party Size</th>
            <th>Seat Number</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(res => (
            <tr key={res.id}>
              <td>{res.id}</td>
              <td>{res.customer}</td>
              <td>{res.restaurant}</td>
              <td>{res.date}</td>
              <td>{res.time}</td>
              <td>{res.partySize}</td>
              <td><Badge bg="secondary">{res.seatNumber}</Badge></td>
              <td>
                <Badge bg={res.status === "Confirmed" ? "success" : res.status === "Pending" ? "warning" : "danger"}>
                  {res.status}
                </Badge>
              </td>
              <td>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleUpdateStatus(res.id, "Confirmed")}
                >
                  Confirm
                </Button>{" "}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleUpdateStatus(res.id, "Cancelled")}
                >
                  Cancel
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      )}
    </Container>
  );
}
