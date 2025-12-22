import React from "react";
import { Container, Table, Button } from "react-bootstrap";

export default function StaffReservations() {
  // Mock 数据
  const reservations = [
    { id: 1, customer: "Alice", date: "2025-12-22", time: "18:00", partySize: 4, status: "Confirmed" },
    { id: 2, customer: "Bob", date: "2025-12-22", time: "19:00", partySize: 2, status: "Pending" },
  ];

  const handleUpdateStatus = (id, newStatus) => {
    alert(`Reservation ${id} status updated to ${newStatus}`);
    // 这里可以接真实 API 更新状态
  };

  return (
    <Container className="my-5">
      <h2>Manage Reservations</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Time</th>
            <th>Party Size</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(res => (
            <tr key={res.id}>
              <td>{res.id}</td>
              <td>{res.customer}</td>
              <td>{res.date}</td>
              <td>{res.time}</td>
              <td>{res.partySize}</td>
              <td>{res.status}</td>
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
    </Container>
  );
}
