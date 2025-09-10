// src/pages/Home.js - Updated with pet features
import React from 'react';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { currentUser } = useAuth();

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to PawPals 🐾</h1>
        <p>Connect with pet owners in your community</p>
        {!currentUser && (
          <div className="cta-buttons">
            <a href="/register" className="btn btn-primary">Join PawPals</a>
            <a href="/login" className="btn btn-secondary">Sign In</a>
          </div>
        )}
      </div>
      
      {currentUser ? (
        <div className="user-dashboard">
          <h2>Welcome back, {currentUser.displayName}!</h2>
          <div className="quick-actions">
            <a href="/my-pets" className="action-card">
              <h3>My Pets</h3>
              <p>Manage your pet profiles and photos</p>
            </a>
            <a href="/browse-pets" className="action-card">
              <h3>Browse Pets</h3>
              <p>Discover pets in your community</p>
            </a>
            <a href="/events" className="action-card">
              <h3>Events</h3>
              <p>Find pet meetups near you</p>
            </a>
            <a href="/profile" className="action-card">
              <h3>My Profile</h3>
              <p>View and edit your profile</p>
            </a>
          </div>
        </div>
      ) : (
        <div className="features-section">
          <div className="quick-actions">
            <div className="action-card">
              <h3>Pet Profiles</h3>
              <p>Create detailed profiles for all your pets with photos and personality traits</p>
            </div>
            <a href="/browse-pets" className="action-card">
              <h3>Browse Pets</h3>
              <p>Discover pets in your community</p>
            </a>
            <div className="action-card">
              <h3>Meetups & Events</h3>
              <p>Organize and join pet playdates and community events</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;