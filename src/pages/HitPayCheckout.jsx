// HitPayCheckout.jsx - HitPay payment integration
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import { formatPrice } from '../utils/formatters';
import { AppContext } from '../context/AppContext';
import { orderAPI, paymentAPI, authAPI } from '../services/api';

export default function HitPayCheckout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart: contextCart, clearCart } = useContext(AppContext);
  const orderCreated = useRef(false); // Prevent duplicate order creation
  
  // Get data from location state (passed from PaymentMethod)
  const state = location.state || {};
  const reservation = state.reservation || null;
  const stateCart = state.cart || [];
  const restaurant = state.restaurant || {};
  const customer = state.customer || {};
  const subtotal = state.subtotal || 0;
  
  const cart = stateCart.length > 0 ? stateCart : contextCart;
  const cartItems = cart.length > 0 ? cart : [];
  
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const totalAmount = subtotal || cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

  // Create payment via backend
  const handleCreatePayment = async () => {
    // Prevent duplicate order creation
    if (orderCreated.current) {
      console.log('Order already being created, skipping...');
      return;
    }
    orderCreated.current = true;

    setLoading(true);
    setError('');
    setPaymentUrl('');

    try {
      // Get user profile for payment info
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to continue');
      }

      // Get user profile for customer info
      const userProfile = await authAPI.getProfile();

      // Check sessionStorage for existing order (prevent duplicates on refresh)
      const cartKey = cartItems.map(item => `${item.menuItemId || item.id}-${item.quantity}`).join(',');
      const lastOrderKey = sessionStorage.getItem('lastOrderKey');
      const lastOrderTime = sessionStorage.getItem('lastOrderTime');
      const now = Date.now();

      if (lastOrderKey === cartKey && lastOrderTime && (now - parseInt(lastOrderTime)) < 10000) {
        console.log('Order already exists for this cart, checking for existing order...');
        // Don't throw error, just skip order creation and let user proceed
      }

      // Create order first
      const orderResult = await orderAPI.create({
        reservation_id: reservation?.id || null,
        notes: `Order for ${restaurant?.name || 'Restaurant'}`,
        items: cartItems.map(item => ({
          item_id: item.menuItemId || item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total_amount: totalAmount,
        restaurant_id: restaurant?.id
      });
      
      setOrder(orderResult.order);

      // Store to prevent duplicate orders
      sessionStorage.setItem('lastOrderKey', cartKey);
      sessionStorage.setItem('lastOrderTime', now.toString());

      // Create HitPay payment
      const paymentResult = await paymentAPI.createHitPayPayment({
        order_id: orderResult.order.id,
        amount: totalAmount,
        customer_name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
        customer_email: userProfile.email,
        description: `Order at ${restaurant?.name || 'Restaurant'}`,
        reference_number: `ORD-${orderResult.order.id}-${Date.now()}`
      });

      // Store payment info
      sessionStorage.setItem('paymentInfo', JSON.stringify({
        payment_id: paymentResult.payment_id,
        paymentUrl: paymentResult.payment_url,
        reservation,
        cart: cartItems,
        restaurant,
        customer: userProfile,
        subtotal: totalAmount,
        order: orderResult.order,
        paymentMethod: 'hitpay',
        paymentStatus: 'pending'
      }));

      // Set payment URL for redirect
      setPaymentUrl(paymentResult.payment_url);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to create payment. Please try again.');
      orderCreated.current = false; // Reset to allow retry
      console.error('Full error details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to HitPay payment page
  const handleRedirectToPayment = () => {
    if (paymentUrl) {
      // Clear session storage for fresh payment on return
      sessionStorage.removeItem('lastOrderKey');
      sessionStorage.removeItem('lastOrderTime');
      
      // Redirect to HitPay
      window.location.href = paymentUrl;
    }
  };

  return (
    <>
      <Navbar />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow">
              <Card.Header style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", color: "white", border: "none" }}>
                <h3 className="mb-0">Secure Online Payment</h3>
              </Card.Header>
              <Card.Body>
                {/* Order Summary */}
                {(cartItems.length > 0 || reservation) && (
                  <div className="mb-4 p-3 bg-light rounded">
                    {cartItems.length > 0 && (
                      <>
                        <h5 className="mb-3">Order Summary</h5>
                        {cartItems.map((item, idx) => (
                          <div key={idx} className="d-flex justify-content-between mb-2">
                            <span>{item.name} x {item.quantity}</span>
                            <span>{formatPrice((item.price || 0) * (item.quantity || 0))}</span>
                          </div>
                        ))}
                        <hr />
                      </>
                    )}
                    {reservation && (
                      <div className="mb-2">
                        <p className="mb-1"><strong>Reservation:</strong> {restaurant?.name}</p>
                        <p className="mb-1"><strong>Date:</strong> {reservation.reservation_date}</p>
                        <p className="mb-1"><strong>Time:</strong> {reservation.reservation_time}</p>
                      </div>
                    )}
                    <div className="d-flex justify-content-between fw-bold fs-5 mt-3">
                      <span>Total Amount:</span>
                      <span className="text-primary">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                {/* Payment Link Created */}
                {paymentUrl ? (
                  <Alert variant="success">
                    <Alert.Heading>Payment Ready!</Alert.Heading>
                    <p className="mb-3">
                      Your payment of <strong>{formatPrice(totalAmount)}</strong> is ready. You will be redirected to HitPay secure payment page.
                    </p>
                    
                    <Button
                      variant="success"
                      size="lg"
                      className="w-100 mb-3"
                      onClick={handleRedirectToPayment}
                    >
                      Proceed to Payment - {formatPrice(totalAmount)}
                    </Button>
                    
                    <hr />
                    <small className="text-muted d-block mt-2">
                      <strong>Payment Methods Available:</strong>
                      <ul className="mb-0 mt-2">
                        <li>Credit/Debit Cards (Visa, Mastercard)</li>
                        <li>FPX (Online Banking)</li>
                      </ul>
                    </small>
                  </Alert>
                ) : (
                  /* Create Payment Button */
                  <div className="text-center">
                    <div className="mb-4">
                      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💳</div>
                      <h5 className="mb-3">Ready to Pay</h5>
                      <p className="text-muted">
                        Click the button below to create your payment and proceed to HitPay.
                      </p>
                    </div>
                    
                    <Button
                      variant="success"
                      size="lg"
                      className="px-5"
                      onClick={handleCreatePayment}
                      disabled={loading || totalAmount <= 0}
                      style={{
                        background: "linear-gradient(90deg, #28a745, #20c997)",
                        border: "none",
                      }}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Creating Payment...
                        </>
                      ) : (
                        `Pay ${formatPrice(totalAmount)} Now`
                      )}
                    </Button>

                    {totalAmount <= 0 && (
                      <Alert variant="warning" className="mt-3">
                        No items in cart. Please add items to your cart first.
                      </Alert>
                    )}
                  </div>
                )}
              </Card.Body>
              <Card.Footer className="text-muted">
                <small>
                  <i className="bi bi-shield-check me-1"></i>
                  Secure payment powered by HitPay
                </small>
              </Card.Footer>
            </Card>

            {/* Back Button */}
            <div className="text-center mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                ← Back to Payment Options
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
}
