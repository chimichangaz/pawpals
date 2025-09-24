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

  const brandStyle = {
    fontSize: '1.5rem',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
  };

  const navMenuStyle = {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  };

  const navbarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    padding: '0.75rem 2rem',
    backgroundColor: '#1a1a1a',
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  };

  const navContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const navLinkStyle = {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: '500',
  };

  const btnPrimaryStyle = {
    backgroundColor: '#ff7043',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    fontWeight: '600',
    textDecoration: 'none'
  };

  const btnLinkStyle = {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '1rem'
  };

  const navbarSpacerStyle = {
    height: '70px' // This prevents content from hiding behind the fixed navbar
  };

  return (
    <>
      <nav className="navbar" style={navbarStyle}>
        <div className="nav-container" style={navContainerStyle}>
          <div className="nav-brand">
            <Link to="/" style={brandStyle}>🐾 PawPals</Link>
          </div>

          <div className="nav-menu" style={navMenuStyle}>
            <Link to="/" className="nav-link" style={navLinkStyle}>Home</Link>
            <Link to="/browse-pets" className="nav-link" style={navLinkStyle}>Browse Pets</Link>
            <Link to="/events" className="nav-link" style={navLinkStyle}>Events</Link>
            <Link to="/vetclinics" className="nav-link" style={navLinkStyle}>Vet Clinics</Link>
            <Link to="/forum" className="nav-link" style={navLinkStyle}>Forum</Link>
            <Link to="/pet-videos" className="nav-link" style={navLinkStyle}>🎥 Pet Videos</Link>
            <Link to="/faq" className="nav-link" style={navLinkStyle}>FAQ</Link>

            {currentUser ? (
              <>
                <Link to="/my-pets" className="nav-link" style={navLinkStyle}>My Pets</Link>
                <Link to="/profile" className="nav-link" style={navLinkStyle}>Profile</Link>
                <button onClick={handleLogout} style={btnLinkStyle}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link" style={navLinkStyle}>Sign In</Link>
                <Link to="/register" className="nav-link" style={btnPrimaryStyle}>Join</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <div style={navbarSpacerStyle}></div> {/* This spacer prevents content from hiding behind navbar */}
    </>
  );
}

export default Navbar;