// src/components/common/Navbar.js - Updated with pet navigation
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
          <a href="/">🐾 PawPals</a>
        </div>
        
        <div className="nav-menu">
          <a href="/" className="nav-link">Home</a>
          <a href="/browse-pets" className="nav-link">Browse Pets</a>
          <a href="/events" className="nav-link">Events</a>
          
          {currentUser ? (
            <>
              <a href="/my-pets" className="nav-link">My Pets</a>
              <a href="/profile" className="nav-link">Profile</a>
              <button onClick={handleLogout} className="nav-link btn-link">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <a href="/login" className="nav-link">Sign In</a>
              <a href="/register" className="nav-link btn-primary">Join</a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;