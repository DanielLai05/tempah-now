import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Col, Container, Row, Form, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { auth } from '../firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { AuthContext } from '../context';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validCode, setValidCode] = useState(false);
  const [email, setEmail] = useState('');
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Invalid reset link. Please request a new password reset.');
        setLoading(false);
        return;
      }

      try {
        // Verify the code and get the email
        const email = await verifyPasswordResetCode(auth, oobCode);
        setEmail(email);
        setValidCode(true);
      } catch (error) {
        console.error('Code verification error:', error);
        switch (error.code) {
          case 'auth/expired-action-code':
            setError('This reset link has expired. Please request a new one.');
            break;
          case 'auth/invalid-action-code':
            setError('This reset link is invalid. Please request a new one.');
            break;
          case 'auth/user-disabled':
            setError('This account has been disabled.');
            break;
          default:
            setError('Failed to verify reset link. Please request a new one.');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  useEffect(() => {
    if (currentUser) {
      navigate('/home');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/g;
    const validPassword = regex.test(newPassword);

    if (!validPassword) {
      setError('Password must contain a capital letter, lowercase letter, number, and min length of 8');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      setRedirecting(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      switch (error.code) {
        case 'expired-action-code':
          setError('This reset link has expired. Please request a new one.');
          break;
        case 'invalid-action-code':
          setError('This reset link is invalid. Please request a new one.');
          break;
        case 'weak-password':
          setError('Password is too weak. Please choose a stronger password.');
          break;
        default:
          setError('Failed to reset password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="vh-100">
        <Row className="h-100">
          <Col
            lg={6}
            className="d-none d-lg-block p-0"
            style={{ background: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=1200&fit=crop&q=80') center/cover no-repeat" }}
          />
          <Col
            xs={12}
            lg={6}
            className='d-flex align-items-center justify-content-center'
            style={{ background: "linear-gradient(135deg, #FFF5EE 0%, #FFE4E1 100%)" }}
          >
            <Container className='p-md-5' style={{ maxWidth: '450px', textAlign: 'center' }}>
              <Spinner animation="border" role="status" style={{ color: '#FF7E5F' }}>
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3 text-muted">Verifying reset link...</p>
            </Container>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!validCode) {
    return (
      <Container fluid className="vh-100">
        <Row className="h-100">
          <Col
            lg={6}
            className="d-none d-lg-block p-0"
            style={{ background: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=1200&fit=crop&q=80') center/cover no-repeat" }}
          />
          <Col
            xs={12}
            lg={6}
            className='d-flex align-items-center justify-content-center'
            style={{ background: "linear-gradient(135deg, #FFF5EE 0%, #FFE4E1 100%)" }}
          >
            <Container className='p-md-5' style={{ maxWidth: '450px' }}>
              <h1 className='mb-4 fw-bold' style={{ color: '#FF7E5F' }}>TempahNow</h1>
              <h2 className='mb-4'>Reset Password</h2>

              <Alert variant="danger">
                {error}
              </Alert>

              <div className="mt-4">
                <Link to="/login" style={{ color: '#FF7E5F', textDecoration: 'none' }}>
                  ← Back to Login
                </Link>
              </div>

              <div className="mt-2">
                <Button
                  variant="link"
                  className="p-0 text-decoration-none"
                  style={{ color: '#FF7E5F' }}
                  onClick={() => {
                    // Trigger forgot password modal by setting hash
                    window.location.href = '/login#forgot';
                  }}
                >
                  Request new reset link
                </Button>
              </div>
            </Container>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="vh-100">
      <Row className="h-100">
        <Col
          lg={6}
          className="d-none d-lg-block p-0"
          style={{ background: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=1200&fit=crop&q=80') center/cover no-repeat" }}
        />
        <Col
          xs={12}
          lg={6}
          className='d-flex align-items-center justify-content-center'
          style={{ background: "linear-gradient(135deg, #FFF5EE 0%, #FFE4E1 100%)" }}
        >
          <Container className='p-md-5' style={{ maxWidth: '450px' }}>
            <h1 className='mb-4 fw-bold' style={{ color: '#FF7E5F' }}>TempahNow</h1>
            <h2 className='mb-4'>Reset Password</h2>

            {success ? (
              <>
                <Alert variant="success" className="mb-4">
                  <strong>Success!</strong> Your password has been reset.
                </Alert>
                {redirecting && (
                  <div className="text-center">
                    <Spinner animation="border" role="status" style={{ color: '#FF7E5F' }}>
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-3 text-muted">Redirecting to login page...</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-muted mb-4">
                  Enter your new password for <strong>{email}</strong>
                </p>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className='mb-3'>
                    <Form.Label>New Password</Form.Label>
                    <InputGroup>
                      <Form.Control
                        placeholder='enter your new password'
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <Button
                        variant='outline-secondary'
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Password must contain a capital letter, lowercase letter, number, and min length of 8
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className='mb-4'>
                    <Form.Label>Confirm New Password</Form.Label>
                    <InputGroup>
                      <Form.Control
                        placeholder='re-enter your new password'
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <Button
                        variant='outline-secondary'
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <i className={`bi ${showConfirmPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Button
                    variant='primary'
                    type='submit'
                    className='w-100 py-2'
                    disabled={submitting}
                    style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
                  >
                    {submitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span className="ms-2">Resetting...</span>
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </Form>
              </>
            )}

            {!success && (
              <div className='mt-4 text-center'>
                <Link to="/login" style={{ color: '#FF7E5F', textDecoration: 'none' }}>
                  ← Back to Login
                </Link>
              </div>
            )}
          </Container>
        </Col>
      </Row>
    </Container>
  );
}
