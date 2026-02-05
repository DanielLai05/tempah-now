// PaymentCallback.jsx - HitPay payment callback page
// This page receives the webhook from HitPay and forwards it to the backend
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Card } from 'react-bootstrap';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      const payment_id = searchParams.get('payment_id');
      const status = searchParams.get('status');
      const transaction_id = searchParams.get('transaction_id');

      console.log('HitPay callback received:', { payment_id, status, transaction_id });

      // Forward the callback to the backend API
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

        await fetch(`${API_BASE}/payments/hitpay/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_id,
            status,
            transaction_id
          }),
        });

        console.log('Callback forwarded to backend successfully');
      } catch (error) {
        console.error('Error forwarding callback:', error);
      }

      // Redirect to payment success page
      if (payment_id) {
        navigate(`/payment-success?order_id=${payment_id}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <Container className="py-5 text-center">
      <Card className="mx-auto" style={{ maxWidth: '400px' }}>
        <Card.Body>
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h5>Processing payment...</h5>
          <p className="text-muted">Please wait while we confirm your payment.</p>
        </Card.Body>
      </Card>
    </Container>
  );
}
