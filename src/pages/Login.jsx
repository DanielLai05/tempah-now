import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router';
import { AuthContext } from '../context';
import { Col, Container, Row, Form, Button, Modal, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, actionCodeSettings } from '../firebase';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupReEnterPassword, setSignupReEnterPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [modalShow, setModalShow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  // Forgot password states
  const [forgotPasswordShow, setForgotPasswordShow] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/home');
    }
  }, [currentUser, navigate])

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      
      // Get JWT token from backend for this user
      const loginResult = await authAPI.login(loginEmail);
      if (loginResult.token) {
        localStorage.setItem('token', loginResult.token);
      }
      
      // Sync user to database
      try {
        await authAPI.syncUser({
          email: loginEmail,
          first_name: '',
          last_name: '',
          phone: ''
        });
      } catch (syncError) {
        console.log('Sync warning:', syncError);
      }
      
      setLoginEmail('');
      setLoginPassword('');
      setError('');
      navigate('/home');
    } catch (error) {
      console.error(error);
      setError('invalid-login-credentials');
    } finally {
      setLoading(false);
    }
  }

  const handleShowModal = () => {
    setShowPassword(false);
    setError('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupReEnterPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setModalShow(true);
  }

  const handleClose = () => {
    setModalShow(false);
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/g;
    const validPassword = regex.test(signupPassword);
    
    if (!validPassword) {
      setError('invalid-password-pattern');
      return;
    }

    if (signupPassword !== signupReEnterPassword) {
      setError('unmatch-password');
      return;
    }

    setSignupLoading(true);
    
    try {
      // 1. Create user in Firebase
      console.log('Creating user in Firebase...');
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      const firebaseUid = userCredential.user.uid;
      console.log('Firebase UID:', firebaseUid);
      
      // 2. Save user to Neon database
      console.log('Saving user to Neon database...');
      const result = await authAPI.register({
        firebase_uid: firebaseUid,
        first_name: firstName,
        last_name: lastName,
        email: signupEmail,
        phone: phone || '',
        password: '' // Firebase handles password
      });
      console.log('Database save result:', result);
      
      // Save the new token to localStorage
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      
      setError('');
      setModalShow(false);
      navigate('/home');
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('taken-email');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setSignupLoading(false);
    }
  }

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    try {
      // Debug log to check the action code settings
      console.log('Sending password reset to:', forgotPasswordEmail);
      console.log('Action code settings:', actionCodeSettings);
      
      // Send password reset email with custom continue URL
      await sendPasswordResetEmail(auth, forgotPasswordEmail, actionCodeSettings);
      setForgotPasswordMessage('Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setForgotPasswordShow(false);
        setForgotPasswordEmail('');
        setForgotPasswordMessage('');
      }, 3000);
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error.code === 'auth/user-not-found') {
        setForgotPasswordError('No account found with this email address.');
      } else if (error.code === 'auth/invalid-email') {
        setForgotPasswordError('Please enter a valid email address.');
      } else {
        setForgotPasswordError('Failed to send reset email. Please try again.');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  }

  const handleCloseForgotPassword = () => {
    setForgotPasswordShow(false);
    setForgotPasswordEmail('');
    setForgotPasswordMessage('');
    setForgotPasswordError('');
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
            <h2 className='mb-4'>Login</h2>
            
            {error === 'invalid-login-credentials' && (
              <Alert variant="danger" className="mb-3">
                Invalid email or password
              </Alert>
            )}
            
            <Form className='mt-3' onSubmit={handleLogin}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  value={loginEmail}
                  placeholder='email'
                  type='email'
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group className='mt-3 mb-4'>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  value={loginPassword}
                  placeholder='password'
                  type='password'
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Button 
                variant='primary' 
                type='submit' 
                className='w-100 py-2'
                disabled={loading}
                style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Logging in...</span>
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </Form>

            <div className='mt-3 text-end'>
              <Button
                variant='link'
                className='p-0 text-decoration-none'
                onClick={() => setForgotPasswordShow(true)}
                style={{ color: '#FF7E5F', fontSize: '0.9rem' }}
              >
                Forgot Password?
              </Button>
            </div>

            <div className='my-3 d-flex align-items-center'>
              <span>Not registered?</span>
              <Button
                variant='link'
                className='p-1 text-decoration-none'
                onClick={handleShowModal}
                style={{ color: '#FF7E5F' }}
              >
                Sign Up
              </Button>
              <span>now</span>
            </div>
          </Container>
        </Col>
      </Row>

      <Modal show={modalShow} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Sign Up</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error === 'invalid-password-pattern' && 'Password must contain a capital letter, lowercase letter, number, and min length of 8'}
              {error === 'unmatch-password' && 'Passwords do not match'}
              {error === 'taken-email' && 'Email is already registered'}
              {error !== 'invalid-password-pattern' && error !== 'unmatch-password' && error !== 'taken-email' && error}
            </Alert>
          )}
          
          <Form onSubmit={handleSignup} className='p-2'>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    value={firstName}
                    placeholder='first name'
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    value={lastName}
                    placeholder='last name'
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className='mt-3'>
              <Form.Label>Email</Form.Label>
              <Form.Control
                value={signupEmail}
                placeholder='enter your email here'
                type='email'
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className='mt-3'>
              <Form.Label>Phone (Optional)</Form.Label>
              <Form.Control
                value={phone}
                placeholder='phone number'
                type='tel'
                onChange={(e) => setPhone(e.target.value)}
              />
            </Form.Group>

            <Form.Group className='mt-3'>
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  value={signupPassword}
                  placeholder='enter your password here'
                  type={showPassword ? 'text' : 'password'}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
                <Button
                  variant='outline-secondary'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                </Button>
              </InputGroup>
              <Form.Text className={error === 'invalid-password-pattern' ? 'text-danger' : 'text-muted'}>
                Password must contain a capital letter, lowercase letter, number, and min length of 8
              </Form.Text>
            </Form.Group>

            <Form.Group className='mt-3'>
              <Form.Label>Re-enter Password</Form.Label>
              <InputGroup>
                <Form.Control
                  value={signupReEnterPassword}
                  placeholder='re-enter your password here'
                  type={showPassword ? 'text' : 'password'}
                  onChange={(e) => setSignupReEnterPassword(e.target.value)}
                  required
                />
                <Button
                  variant='outline-secondary'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                </Button>
              </InputGroup>
              {error === 'unmatch-password' && (
                <Form.Text className='text-danger'>Passwords do not match</Form.Text>
              )}
            </Form.Group>

            <Button 
              variant="primary" 
              className='w-100 mt-4 py-2' 
              type='submit'
              disabled={signupLoading}
              style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
            >
              {signupLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Creating account...</span>
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal show={forgotPasswordShow} onHide={handleCloseForgotPassword} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {forgotPasswordMessage && (
            <Alert variant="success">
              {forgotPasswordMessage}
            </Alert>
          )}
          {forgotPasswordError && (
            <Alert variant="danger">
              {forgotPasswordError}
            </Alert>
          )}
          {!forgotPasswordMessage && (
            <p className="text-muted mb-3">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          )}
          <Form onSubmit={handleForgotPassword}>
            <Form.Group>
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={forgotPasswordEmail}
                placeholder="Enter your email"
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Button
              variant="primary"
              type="submit"
              className="w-100 mt-4 py-2"
              disabled={forgotPasswordLoading}
              style={{ background: "linear-gradient(90deg, #FF7E5F, #FEB47B)", border: "none" }}
            >
              {forgotPasswordLoading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Sending...</span>
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  )
}
