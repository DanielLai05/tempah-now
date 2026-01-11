import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AppContext } from '../context/AppContext';
import Navbar from '../components/Navbar';
import { formatPrice } from '../utils/formatters';

export default function HitPayCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart: contextCart } = useContext(AppContext);
  
  // Get data from location state (passed from PaymentMethod)
  const { reservation, cart: stateCart = [], restaurant, customer = {}, subtotal } = location.state || {};
  const cart = stateCart.length > 0 ? stateCart : contextCart;
  
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'MYR',
    purpose: '',
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    // Calculate amount from cart or use subtotal from state
    const totalAmount = subtotal || (cart && cart.length > 0 
      ? cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : 0);
    
    // Set purpose based on order
    const purpose = cart.length > 0 
      ? `Restaurant order - ${restaurant?.name || 'Restaurant'}`
      : `Table reservation - ${restaurant?.name || 'Restaurant'}`;
    
    setFormData(prev => ({ 
      ...prev, 
      amount: totalAmount,
      purpose: purpose,
      name: customer.name || prev.name,
      email: customer.email || prev.email,
      phone: customer.phone || prev.phone
    }));
  }, [cart, subtotal, restaurant, customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPaymentUrl('');

    try {
      const BACKEND_URL = 'https://2f3ede99-a9b4-44b8-ad0f-6dc3bb2337d1-00-9zoktqd1e6s1.sisko.replit.dev:3001';

      const response = await fetch(`${BACKEND_URL}/api/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentUrl(data.url);
        // Store payment info for confirmation page
        sessionStorage.setItem('paymentInfo', JSON.stringify({
          paymentUrl: data.url,
          reservation,
          cart,
          restaurant,
          customer: formData,
          subtotal: formData.amount,
          paymentMethod: 'gateway'
        }));
      } else {
        setError(data.error || 'Failed to create payment');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please ensure backend is running');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPaymentUrl('');
    setFormData({
      amount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0) || '',
      currency: 'SGD',
      purpose: '',
      name: '',
      email: '',
      phone: ''
    });
  };

  const currencies = ['MYR', 'SGD', 'USD', 'EUR', 'GBP'];
  const totalAmount = subtotal || (cart && cart.length > 0 
    ? cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0);

  return (
    <>
      <Navbar />
      <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">Secure Online Payment</h3>
            </Card.Header>
            <Card.Body>
              {/* Order Summary */}
              {(cart.length > 0 || reservation) && (
                <div className="mb-4 p-3 bg-light rounded">
                  {cart.length > 0 && (
                    <>
                      <h5 className="mb-3">Order Summary</h5>
                      {cart.map((item, idx) => (
                        <div key={idx} className="d-flex justify-content-between mb-2">
                          <span>{item.name} x {item.quantity}</span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <hr />
                    </>
                  )}
                  {reservation && (
                    <div className="mb-2">
                      <p className="mb-1"><strong>Reservation:</strong> {reservation.restaurant || restaurant?.name}</p>
                      <p className="mb-1"><strong>Date:</strong> {reservation.date} at {reservation.time}</p>
                    </div>
                  )}
                  <div className="d-flex justify-content-between fw-bold fs-5 mt-3">
                    <span>Total Amount:</span>
                    <span className="text-primary">{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              )}
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {paymentUrl ? (
                <Alert variant="success">
                  <Alert.Heading>Payment Link Created!</Alert.Heading>
                  <p className="mb-2">Click the button below to proceed with payment:</p>
                  <Button
                    variant="success"
                    size="lg"
                    className="w-100 mb-3"
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      // After payment, user will be redirected back
                      // We'll handle the redirect in a callback or check sessionStorage
                    }}
                  >
                    Pay Now - {formatPrice(totalAmount)}
                  </Button>
                  <div className="text-center">
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => {
                        // Navigate to confirmation if payment was completed
                        const paymentInfo = sessionStorage.getItem('paymentInfo');
                        if (paymentInfo) {
                          const info = JSON.parse(paymentInfo);
                          navigate("/order-confirmation", { 
                            state: {
                              ...info,
                              paymentStatus: 'pending'
                            }
                          });
                        }
                      }}
                    >
                      I've Completed Payment
                    </Button>
                  </div>
                  <hr />
                  <small className="text-muted d-block mt-2">
                    <strong>Note:</strong> After completing payment, click "I've Completed Payment" to confirm your order.
                  </small>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount *</Form.Label>
                    <Form.Control
                      type="number"
                      name="amount"
                      value={formData.amount}
                      readOnly 
                      placeholder="10.00"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Currency *</Form.Label>
                    <Form.Select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      required
                    >
                      {currencies.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Purpose *</Form.Label>
                    <Form.Control
                      type="text"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                      placeholder="Payment for services"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Customer Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Customer Email *</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Customer Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+60123456789"
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Creating Payment...
                      </>
                    ) : (
                      'Create Payment Link'
                    )}
                  </Button>
                </form>
              )}
            </Card.Body>
            <Card.Footer className="text-muted">
              <small>
                <strong>Note:</strong> This is a sandbox environment for testing.
                Use test credentials for payment.
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      </Container>
    </>
  );
}
