// src/components/common/Navbar.js
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/">🐾 PawPals</Link>
        </div>

        <div className="nav-menu">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/browse-pets" className="nav-link">Browse Pets</Link>
          <Link to="/events" className="nav-link">Events</Link>
          <Link to="/vetclinics" className="nav-link">Vet Clinics</Link>
          <Link to="/forum" className="nav-link">Forum</Link>

          {currentUser ? (
            <>
              <Link to="/my-pets" className="nav-link">My Pets</Link>
              <Link to="/profile" className="nav-link">Profile</Link>
              <button onClick={handleLogout} className="nav-link btn-link">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register" className="nav-link btn-primary">Join</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
