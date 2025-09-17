// src/pages/Profile.js - COMPLETE VERSION with Enhanced Background
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { uploadImage, uploadImageAsBase64, testSupabaseConnection } from '../services/supabase';

function Profile() {
  const { currentUser, userProfile, getUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadMethod, setUploadMethod] = useState('supabase');
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: {
      city: '',
      state: ''
    },
    interests: [],
    profileImage: ''
  });

  // Load user data when component mounts or userProfile changes
  useEffect(() => {
    if (currentUser && userProfile) {
      setFormData({
        displayName: currentUser.displayName || '',
        bio: userProfile.bio || '',
        location: {
          city: userProfile.location?.city || '',
          state: userProfile.location?.state || ''
        },
        interests: userProfile.interests || [],
        profileImage: userProfile.profileImage || ''
      });
    }
  }, [currentUser, userProfile]);

  const petInterests = [
    'Dogs', 'Cats', 'Birds', 'Rabbits', 'Fish', 'Reptiles', 
    'Training', 'Grooming', 'Veterinary Care', 'Pet Photography',
    'Pet Sitting', 'Dog Walking', 'Rescue Work', 'Breeding',
    'Agility Training', 'Pet Nutrition', 'Pet Travel'
  ];

  function handleChange(e) {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties like location.city
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  }

  function handleInterestToggle(interest) {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log('=== PROFILE IMAGE UPLOAD START ===');
    console.log('Selected file:', file);
    
    try {
      setUploading(true);
      setError('');
      
      let imageUrl;
      
      try {
        // First try Supabase upload
        console.log('Attempting Supabase upload...');
        const isConnected = await testSupabaseConnection();
        if (!isConnected) {
          throw new Error('Supabase connection failed');
        }
        
        imageUrl = await uploadImage(file, 'profiles');
        setUploadMethod('supabase');
        console.log('Supabase upload successful:', imageUrl);
        
      } catch (supabaseError) {
        console.log('Supabase upload failed, trying base64 fallback:', supabaseError);
        
        // Fallback to base64 if Supabase fails
        try {
          imageUrl = await uploadImageAsBase64(file);
          setUploadMethod('base64');
          console.log('Base64 upload successful');
          
        } catch (base64Error) {
          console.error('Both upload methods failed:', base64Error);
          throw new Error('Unable to upload image. Please try a smaller file or try again later.');
        }
      }
      
      setFormData(prev => ({
        ...prev,
        profileImage: imageUrl
      }));
      
      // Clear the file input
      e.target.value = '';
      console.log('=== PROFILE IMAGE UPLOAD SUCCESS ===');
      
    } catch (error) {
      console.error('=== PROFILE IMAGE UPLOAD ERROR ===', error);
      setError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return;
    }

    console.log('=== PROFILE UPDATE START ===');
    console.log('Form data:', formData);
    console.log('Current user:', currentUser);

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // First, ensure the user document exists in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          console.log('User document does not exist, creating it...');
          // Create the document first
          await setDoc(userDocRef, {
            email: currentUser.email,
            displayName: formData.displayName.trim(),
            bio: formData.bio.trim(),
            location: {
              city: formData.location.city.trim(),
              state: formData.location.state.trim()
            },
            interests: formData.interests,
            profileImage: formData.profileImage,
            uploadMethod: uploadMethod,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log('User document created successfully');
        } else {
          console.log('User document exists, updating...');
          // Update existing document
          await updateDoc(userDocRef, {
            displayName: formData.displayName.trim(),
            bio: formData.bio.trim(),
            location: {
              city: formData.location.city.trim(),
              state: formData.location.state.trim()
            },
            interests: formData.interests,
            profileImage: formData.profileImage,
            uploadMethod: uploadMethod,
            updatedAt: new Date()
          });
          console.log('User document updated successfully');
        }
      } catch (firestoreError) {
        console.error('Firestore update error:', firestoreError);
        throw new Error(`Database update failed: ${firestoreError.message}`);
      }

      // Then update Firebase Auth profile (separate try-catch)
      try {
        console.log('Updating Firebase Auth profile...');
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName.trim(),
          photoURL: formData.profileImage
        });
        console.log('Firebase Auth profile updated successfully');
      } catch (authError) {
        console.error('Firebase Auth update error:', authError);
        // Don't throw here - Firestore update succeeded
        console.log('Auth update failed but Firestore succeeded, continuing...');
      }

      // Refresh the user profile in context
      try {
        await getUserProfile(currentUser.uid);
        console.log('User profile refreshed successfully');
      } catch (refreshError) {
        console.error('Profile refresh error:', refreshError);
        // Don't throw - the main update succeeded
      }
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      console.log('=== PROFILE UPDATE SUCCESS ===');

    } catch (error) {
      console.error('=== PROFILE UPDATE ERROR ===', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function cancelEdit() {
    // Reset form data to original values
    if (currentUser && userProfile) {
      setFormData({
        displayName: currentUser.displayName || '',
        bio: userProfile.bio || '',
        location: {
          city: userProfile.location?.city || '',
          state: userProfile.location?.state || ''
        },
        interests: userProfile.interests || [],
        profileImage: userProfile.profileImage || ''
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  }

  if (!currentUser) {
    return (
      <div className="profile-page-background">
        <div className="page-container">
          <div className="empty-state">
            <h3>Please sign in to view your profile</h3>
            <p>You need to be logged in to access your profile page.</p>
            <a href="/login" className="btn btn-primary">Sign In</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-background">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>My Profile</h1>
            <p>Manage your PawPals profile and preferences</p>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="btn btn-primary"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <div className="profile-container">
          {isEditing ? (
            <div className="profile-edit-form">
              <form onSubmit={handleSubmit}>
                {/* Profile Image Section */}
                <div className="profile-image-section">
                  <div className="current-profile-image">
                    {formData.profileImage ? (
                      <img 
                        src={formData.profileImage} 
                        alt="Profile"
                        className="profile-image-large"
                        onError={(e) => {
                          console.log('Image failed to load:', formData.profileImage);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="profile-placeholder-large">
                        <span className="profile-initials">
                          {formData.displayName ? formData.displayName.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="image-upload-section">
                    <label htmlFor="profileImage" className="btn btn-secondary">
                      {uploading ? 'Uploading...' : 'Change Photo'}
                    </label>
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                    <small>
                      • Supported formats: JPG, PNG, WebP<br/>
                      • Maximum size: 5MB<br/>
                      • Images will be automatically optimized
                    </small>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="form-section">
                  <h3>Basic Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="displayName">Display Name *</label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleChange}
                      required
                      maxLength={50}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="4"
                      maxLength={500}
                      placeholder="Tell other pet owners about yourself..."
                    />
                    <small>{formData.bio.length}/500 characters</small>
                  </div>
                </div>

                {/* Location */}
                <div className="form-section">
                  <h3>Location</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="location.city">City</label>
                      <input
                        type="text"
                        id="location.city"
                        name="location.city"
                        value={formData.location.city}
                        onChange={handleChange}
                        maxLength={50}
                        placeholder="Enter your city"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="location.state">State/Region</label>
                      <input
                        type="text"
                        id="location.state"
                        name="location.state"
                        value={formData.location.state}
                        onChange={handleChange}
                        maxLength={50}
                        placeholder="Enter your state or region"
                      />
                    </div>
                  </div>
                </div>

                {/* Interests */}
                <div className="form-section">
                  <h3>Pet Interests</h3>
                  <p className="form-description">
                    Select your pet-related interests to connect with like-minded owners
                  </p>
                  <div className="interests-grid">
                    {petInterests.map(interest => (
                      <label key={interest} className="interest-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                        />
                        <span>{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading || uploading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="profile-view">
              <div className="profile-header">
                <div className="profile-image-container">
                  {formData.profileImage ? (
                    <img 
                      src={formData.profileImage} 
                      alt="Profile"
                      className="profile-image-large"
                      onError={(e) => {
                        console.log('Profile view image failed to load');
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="profile-placeholder-large">
                      <span className="profile-initials">
                        {formData.displayName ? formData.displayName.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="profile-info">
                  <h2>{formData.displayName || 'No name set'}</h2>
                  <p className="profile-email">{currentUser.email}</p>
                  {formData.location.city && (
                    <p className="profile-location">
                      📍 {formData.location.city}
                      {formData.location.state && `, ${formData.location.state}`}
                    </p>
                  )}
                </div>
              </div>

              {formData.bio && (
                <div className="profile-section">
                  <h3>About Me</h3>
                  <p className="profile-bio">{formData.bio}</p>
                </div>
              )}

              {formData.interests.length > 0 && (
                <div className="profile-section">
                  <h3>Pet Interests</h3>
                  <div className="interests-display">
                    {formData.interests.map(interest => (
                      <span key={interest} className="interest-tag">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="profile-actions">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  Edit Profile
                </button>
                <a href="/my-pets" className="btn btn-secondary">
                  My Pets
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;