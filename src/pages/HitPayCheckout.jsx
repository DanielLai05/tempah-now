import React, { useState, useEffect, useContext } from 'react';
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

export default function HitPayCheckout() {
  const { cart } = useContext(AppContext); // 从 context 获取购物车
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'SGD',
    purpose: '',
    name: '',
    email: '',
    phone: ''
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

  // 计算总金额并填入 amount
  useEffect(() => {
    if (cart && cart.length > 0) {
      const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setFormData(prev => ({ ...prev, amount: totalAmount }));
    }
  }, [cart]);

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

  const currencies = ['SGD', 'USD', 'MYR', 'EUR', 'GBP'];

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">HitPay Sandbox Payment</h3>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {paymentUrl ? (
                <Alert variant="success">
                  <Alert.Heading>Payment Link Created!</Alert.Heading>
                  <p className="mb-2">Click the link below to proceed with payment:</p>
                  <Button
                    variant="success"
                    size="lg"
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pay Now
                  </Button>
                  <hr />
                  <small className="text-muted d-block mt-2">
                    Payment URL: <br />
                    <code className="text-wrap">{paymentUrl}</code>
                  </small>
                  <Button variant="secondary" className="mt-3" onClick={handleReset}>
                    Create Another Payment
                  </Button>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount *</Form.Label>
                    <Form.Control
                      type="number"
                      name="amount"
                      value={formData.amount}
                      readOnly // 金额不可更改
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
  );
}
