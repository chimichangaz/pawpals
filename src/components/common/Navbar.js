// src/components/common/Navbar.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

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
    minWidth: '150px', // Ensure brand has minimum space
  };

  const navMenuStyle = {
    display: 'flex',
    gap: '1.2rem', // Slightly reduced gap to fit more items
    alignItems: 'center',
    flexWrap: 'nowrap', // Prevent wrapping
    overflow: 'hidden', // Hide overflow if needed
  };

  const navbarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    padding: '1rem 2rem', // Increased vertical padding
    backgroundColor: '#1a1a1a',
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    minHeight: '80px', // Set minimum height for navbar
  };

  const navContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '1400px', // Increased max width to accommodate more items
    margin: '0 auto',
    height: '100%',
  };

  const navLinkStyle = {
    color: '#fff',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
    padding: '0.6rem 1rem',
    borderRadius: '6px',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 1,
  };

  const navLinkHoverStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateY(-2px)',
  };

  const navLinkActiveStyle = {
    backgroundColor: '#ff7043',
    boxShadow: '0 4px 12px rgba(255, 112, 67, 0.3)',
    transform: 'translateY(-2px)',
  };

  const btnPrimaryStyle = {
    backgroundColor: '#ff7043',
    color: 'white',
    padding: '0.6rem 1.2rem',
    borderRadius: '4px',
    fontWeight: '600',
    textDecoration: 'none',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  };

  const btnLinkStyle = {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
    padding: '0.6rem 1rem',
    borderRadius: '6px',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 1,
  };

  const navbarSpacerStyle = {
    height: '100px' // Increased to match the larger navbar
  };

  // Helper function to get link style based on active and hover state
  const getLinkStyle = (path, isHovered) => {
    const isActive = location.pathname === path;
    return {
      ...navLinkStyle,
      ...(isActive ? navLinkActiveStyle : {}),
      ...(isHovered && !isActive ? navLinkHoverStyle : {}),
    };
  };

  // Helper function to create nav link with hover effects
  const NavLink = ({ to, children, onMouseEnter, onMouseLeave }) => (
    <Link 
      to={to} 
      style={getLinkStyle(to, hoveredItem === to)}
      onMouseEnter={() => {
        setHoveredItem(to);
        if (onMouseEnter) onMouseEnter();
      }}
      onMouseLeave={() => {
        setHoveredItem(null);
        if (onMouseLeave) onMouseLeave();
      }}
    >
      {children}
    </Link>
  );

  return (
    <>
      <nav className="navbar" style={navbarStyle}>
        <div className="nav-container" style={navContainerStyle}>
          <div className="nav-brand">
            <Link to="/" style={brandStyle}>🐾 PawPals</Link>
          </div>

          <div className="nav-menu" style={navMenuStyle}>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/browse-pets">Browse Pets</NavLink>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/pet-walk-tracker">🚶‍♂️ Walk Tracker</NavLink>
            <NavLink to="/vetclinics">Vet Clinics</NavLink>
            <NavLink to="/forum">Forum</NavLink>
            <NavLink to="/pet-videos">🎥 Pet Videos</NavLink>
            <NavLink to="/faq">FAQ</NavLink>

            {currentUser ? (
              <>
                <NavLink to="/my-pets">My Pets</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                <button 
                  onClick={handleLogout} 
                  style={{
                    ...btnLinkStyle,
                    ...(hoveredItem === 'signout' ? navLinkHoverStyle : {})
                  }}
                  onMouseEnter={() => setHoveredItem('signout')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Sign In</NavLink>
                <Link 
                  to="/register" 
                  style={{
                    ...btnPrimaryStyle,
                    ...(hoveredItem === 'register' ? { 
                      backgroundColor: '#e55a2b', 
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(255, 112, 67, 0.4)'
                    } : {})
                  }}
                  onMouseEnter={() => setHoveredItem('register')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  Join
                </Link>
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