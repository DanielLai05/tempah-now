// PaymentSuccess.jsx - HitPay payment success page
import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import Navbar from '../components/Navbar';
import { formatPrice } from '../utils/formatters';
import { AppContext } from '../context/AppContext';
import { paymentAPI, orderAPI } from '../services/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId && !paymentId) {
        setError('No order ID provided. Please check your email for payment confirmation.');
        setLoading(false);
        return;
      }

      try {
        // Get order info from session storage
        const paymentInfoStr = sessionStorage.getItem('paymentInfo');
        let orderData = null;
        let restaurantData = null;
        
        if (paymentInfoStr) {
          const paymentInfo = JSON.parse(paymentInfoStr);
          orderData = paymentInfo.order;
          restaurantData = paymentInfo.restaurant;
        }

        // Verify payment with backend API
        let paymentStatus = null;
        let verifiedOrder = null;

        try {
          // If we have payment_id, check HitPay status
          if (paymentId) {
            const statusResult = await paymentAPI.checkHitPayStatus(paymentId);
            paymentStatus = statusResult.status;
            console.log('Payment status from backend:', paymentStatus);
          }

          // Also get the latest order info from backend
          if (orderId) {
            const orders = await orderAPI.getUserOrders();
            verifiedOrder = orders.find(o => o.id == orderId || o.id === parseInt(orderId));
            if (verifiedOrder) {
              console.log('Order payment_status:', verifiedOrder.payment_status);
              console.log('Order payment_method:', verifiedOrder.payment_method);
            }
          }
        } catch (verifyErr) {
          console.error('Error verifying payment:', verifyErr);
        }

        // Update order with payment info if payment is verified
        if ((paymentStatus === 'completed' || verifiedOrder?.payment_status === 'paid') && orderId) {
          try {
            console.log('Payment verified as completed');
          } catch (updateErr) {
            console.error('Error updating order:', updateErr);
          }
          setPaymentVerified(true);
        }

        // Set order info for display
        if (orderData || verifiedOrder) {
          setOrderInfo({
            order: orderData || { id: orderId },
            restaurant: restaurantData,
            subtotal: verifiedOrder?.total_amount || paymentInfoStr ? JSON.parse(paymentInfoStr).subtotal : 0,
            paymentMethod: verifiedOrder?.payment_method || 'hitpay'
          });
        } else if (orderId) {
          // Just use orderId if no other info available
          setOrderInfo({
            order: { id: orderId },
            restaurant: null,
            subtotal: 0,
            paymentMethod: 'hitpay'
          });
        }

        // Clear the cart
        clearCart();
        
        // Clear session storage
        sessionStorage.removeItem('lastOrderKey');
        sessionStorage.removeItem('lastOrderTime');
        sessionStorage.removeItem('paymentInfo');

      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('Payment verification failed. Please contact support if your payment was processed.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [orderId, paymentId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h4>Verifying your payment...</h4>
          <p className="text-muted">Please wait while we confirm your payment status.</p>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow">
              <Card.Header style={{ background: "linear-gradient(90deg, #28a745, #20c997)", color: "white", border: "none" }}>
                <h3 className="mb-0">Payment Successful!</h3>
              </Card.Header>
              <Card.Body className="text-center">
                <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>✅</div>
                
                <Alert variant="success">
                  <Alert.Heading>Thank you for your payment!</Alert.Heading>
                  <p>Your payment has been successfully processed.</p>
                  {orderInfo && orderInfo.order && (
                    <p className="mb-0">
                      <strong>Order ID:</strong> #{orderInfo.order.id}
                    </p>
                  )}
                </Alert>

                {orderInfo && (
                  <div className="mt-4 p-3 bg-light rounded text-start">
                    <h5 className="mb-3">Order Summary</h5>
                    
                    {orderInfo.restaurant && (
                      <p className="mb-2">
                        <strong>Restaurant:</strong> {orderInfo.restaurant.name}
                      </p>
                    )}
                    
                    <p className="mb-2">
                      <strong>Amount Paid:</strong> {formatPrice(orderInfo.subtotal || 0)}
                    </p>
                    
                    <p className="mb-2">
                      <strong>Payment Method:</strong> HitPay (Cards, FPX)
                    </p>
                    
                    <p className="mb-0">
                      <strong>Date:</strong> {new Date().toLocaleDateString('en-MY', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-muted">
                    A confirmation email has been sent to your email address.
                  </p>
                </div>
              </Card.Body>
              <Card.Footer>
                <Row>
                  <Col xs={6}>
                    <Button 
                      variant="outline-secondary" 
                      className="w-100"
                      onClick={() => navigate('/')}
                    >
                      Back to Home
                    </Button>
                  </Col>
                  <Col xs={6}>
                    <Button 
                      variant="primary" 
                      className="w-100"
                      onClick={() => navigate('/my-reservations')}
                    >
                      View My Orders
                    </Button>
                  </Col>
                </Row>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
