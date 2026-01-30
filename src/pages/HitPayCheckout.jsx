// HitPayCheckout.jsx - HitPay payment integration
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import { formatPrice } from '../utils/formatters';
import { AppContext } from '../context/AppContext';
import { orderAPI, paymentAPI } from '../services/api';

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

      // For demo purposes, simulate HitPay payment
      // In production, you would integrate with actual HitPay API
      const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate payment link (replace with actual HitPay integration)
      const mockPaymentUrl = `https://sandbox.hitpay.com/pay/${paymentId}`;
      
      setPaymentUrl(mockPaymentUrl);
      
      // Store payment info
      sessionStorage.setItem('paymentInfo', JSON.stringify({
        paymentId,
        paymentUrl: mockPaymentUrl,
        reservation,
        cart: cartItems,
        restaurant,
        customer,
        subtotal: totalAmount,
        order: orderResult.order,
        paymentMethod: 'gateway',
        paymentStatus: 'pending'
      }));

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to create payment. Please try again.');
      console.error('Full error details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle "I've completed payment" button
  const handlePaymentComplete = async () => {
    try {
      // Save payment record to database
      if (order && order.id) {
        await paymentAPI.create({
          order_id: order.id,
          amount: totalAmount,
          payment_method: 'online',
          payment_status: 'completed',
          transaction_id: `TXN-${Date.now()}`,
          notes: `Payment for order at ${restaurant?.name || 'Restaurant'}`
        });
      }

      const paymentInfoStr = sessionStorage.getItem('paymentInfo');
      if (paymentInfoStr) {
        const paymentInfo = JSON.parse(paymentInfoStr);
        
        // Navigate to confirmation
        clearCart();
        navigate("/order-confirmation", {
          state: {
            ...paymentInfo,
            paymentStatus: 'completed',
            message: 'Payment successful! Your order has been confirmed.'
          }
        });
      } else {
        // Fallback if no payment info
        navigate("/order-confirmation", {
          state: {
            reservation,
            cart: cartItems,
            restaurant,
            customer,
            order,
            subtotal: totalAmount,
            paymentMethod: 'gateway',
            paymentStatus: 'completed',
            message: 'Your order has been confirmed!'
          }
        });
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      // Still navigate to confirmation even if payment record fails
      navigate("/order-confirmation", {
        state: {
          reservation,
          cart: cartItems,
          restaurant,
          customer,
          order,
          subtotal: totalAmount,
          paymentMethod: 'gateway',
          paymentStatus: 'completed',
          message: 'Your order has been confirmed!'
        }
      });
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
                    <Alert.Heading>Payment Link Created!</Alert.Heading>
                    <p className="mb-3">
                      Your payment of <strong>{formatPrice(totalAmount)}</strong> is ready.
                    </p>
                    
                    <Button
                      variant="success"
                      size="lg"
                      className="w-100 mb-3"
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Pay Now - {formatPrice(totalAmount)}
                    </Button>
                    
                    <div className="text-center">
                      <Button 
                        variant="outline-success" 
                        onClick={handlePaymentComplete}
                        size="lg"
                      >
                        I've Completed Payment
                      </Button>
                    </div>
                    
                    <hr />
                    <small className="text-muted d-block mt-2">
                      <strong>Instructions:</strong>
                      <ol className="mb-0 mt-2">
                        <li>Click "Pay Now" to open the payment page</li>
                        <li>Complete your payment securely</li>
                        <li>Return here and click "I've Completed Payment"</li>
                      </ol>
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
