import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router';
import { AuthContext } from '../context';
import { Col, Container, Row, Form, Button, Modal } from 'react-bootstrap';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupReEnterPassword, setSignupReEnterPassword] = useState('');
  const [modalShow, setModalShow] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/home');
    }
  }, [currentUser, navigate])

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setLoginEmail('');
      setLoginPassword('');
      setError('');
      navigate('/home');
    } catch (error) {
      console.error(error);
      setError('invalid-login-credentials');
    }
  }

  const handleClose = () => {
    setModalShow(false);
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/g;
    const validPassword = regex.test(signupPassword)
    if (!validPassword) {
      console.log(error);
      setError('invalid-password-pattern');
      return;
    }

    if (signupPassword !== signupReEnterPassword) {
      setError('unmatch-password');
      console.log(error);
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      setError('')
    } catch (error) {
      console.error(error);
      setError('taken-email');
    }
  }
  return (
    <Container fluid className="vh-100">

      <Row className="h-100">
        <Col
          lg={6}
          className="d-none d-lg-block p-0"
          style={{ background: "url('https://firebasestorage.googleapis.com/v0/b/restaurant-table-booking-a1302.firebasestorage.app/o/login-page-background.png?alt=media&token=67af9978-1995-471a-bb0f-f9fa4a393d64') center/cover no-repeat" }}
        />
        <Col
          xs={12}
          lg={6}
          className='bg-warning'


        >
          <Container className='mt-5 p-md-5' >
            <h1 className='mb-5 fst-italic'>TempahNow</h1>
            <h2>Login</h2>
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
              <Form.Group className='mt-3 mb-3'>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  value={loginPassword}
                  placeholder='password'
                  type='password'
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                {
                  error === 'invalid-login-credentials' && <Form.Text className='text-danger'>
                    Invalid email or password
                  </Form.Text>

                }
              </Form.Group>

              <Button variant='success' type='submit'>Login</Button>
            </Form>
            <div className='my-2 d-flex align-items-center'>Not register?
              <Button
                variant='link'
                className='p-1 text-success'
                onClick={() => setModalShow(true)}
              >Sign-Up</Button>
              now</div>

          </Container>

        </Col>
      </Row>
      <Modal show={modalShow} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Sign-Up</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSignup} className='p-2'>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control
                value={signupEmail}
                placeholder='enter your email here'
                type='email'
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                autoFocus
              />
              {
                error === 'taken-email' &&
                <Form.Text className='text-danger'>email is registered</Form.Text>
              }

            </Form.Group>
            <Form.Group className='mt-3 '>
              <Form.Label>Password</Form.Label>
              <Form.Control
                value={signupPassword}
                placeholder='enter your password here'
                type='password'
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />

              <Form.Text
                className={error === 'invalid-password-pattern' ? 'text-danger' : ''}
              >Password must contain a capital letter, lowercase letter, number, and min length of 8</Form.Text>
            </Form.Group>
            <Form.Group className='mt-3 '>
              <Form.Label>Re-enter Password</Form.Label>
              <Form.Control
                value={signupReEnterPassword}
                placeholder='re-enter your passsword here'
                type='password'
                onChange={(e) => setSignupReEnterPassword(e.target.value)}
                required
              />
              {
                error === 'unmatch-password' &&
                <Form.Text className='text-danger'>Password not match</Form.Text>
              }
            </Form.Group>
            <Button variant="success" className='w-100 mt-3' type='submit'>
              Sign-Up
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>


  )
}
