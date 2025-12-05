import React, { useContext, useEffect, } from 'react'

import { useNavigate } from 'react-router';
import { AuthContext } from '../context';
import { Button } from 'react-bootstrap';
import { auth } from '../firebase';

export default function Home() {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    auth.signOut();
  }

  return (
    <div>
      <h1>Home</h1>
      <Button onClick={handleLogout}>Logout</Button>
    </div>
  )
}
