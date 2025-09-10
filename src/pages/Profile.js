// src/pages/Profile.js
import React from 'react';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <div>Please sign in to view your profile.</div>;
  }

  return (
    <div className="profile-page">
      <h2>My Profile</h2>
      <div className="profile-info">
        <h3>{currentUser.displayName || 'No name set'}</h3>
        <p>Email: {currentUser.email}</p>
        {userProfile && (
          <>
            <p>Bio: {userProfile.bio || 'No bio yet'}</p>
            <p>Location: {userProfile.location?.city || 'No location set'}</p>
          </>
        )}
      </div>
      
      <div className="profile-actions">
        <button className="btn btn-secondary">Edit Profile</button>
        <button className="btn btn-secondary">Add Pet</button>
      </div>
    </div>
  );
}

export default Profile;