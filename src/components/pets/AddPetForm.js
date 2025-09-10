// src/components/pets/AddPetForm.js - IMPROVED VERSION with fallback
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PetsService } from '../../services/pets.service';
import { uploadImage, uploadImageAsBase64, testSupabaseConnection } from '../../services/supabase';

function AddPetForm({ onSuccess, onCancel, editingPet = null }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMethod, setUploadMethod] = useState('supabase'); // or 'base64'
  const [formData, setFormData] = useState({
    name: editingPet?.name || '',
    type: editingPet?.type || 'dog',
    breed: editingPet?.breed || '',
    age: editingPet?.age || '',
    gender: editingPet?.gender || 'male',
    bio: editingPet?.bio || '',
    personality: editingPet?.personality || [],
    images: editingPet?.images || []
  });

  const petTypes = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other'];
  const personalityTraits = [
    'Friendly', 'Playful', 'Calm', 'Energetic', 'Shy', 'Curious', 
    'Protective', 'Gentle', 'Independent', 'Social', 'Smart', 'Loyal'
  ];

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  }

  function handlePersonalityToggle(trait) {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(t => t !== trait)
        : [...prev.personality, trait]
    }));
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log('Selected file:', file);
    
    try {
      setImageUploading(true);
      setError('');
      
      let imageUrl;
      
      try {
        // First try Supabase upload
        console.log('Attempting Supabase upload...');
        const isConnected = await testSupabaseConnection();
        if (!isConnected) {
          throw new Error('Supabase connection failed');
        }
        
        imageUrl = await uploadImage(file, 'pets');
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
        images: [...prev.images, imageUrl]
      }));
      
      // Clear the file input
      e.target.value = '';
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  }

  function removeImage(indexToRemove) {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  }

  // Image compression function
  function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Pet name is required');
      }
      if (!formData.age || parseFloat(formData.age) < 0) {
        throw new Error('Please enter a valid age');
      }

      const petData = {
        ...formData,
        name: formData.name.trim(),
        breed: formData.breed.trim(),
        bio: formData.bio.trim(),
        ownerId: currentUser.uid,
        ownerEmail: currentUser.email,
        ownerDisplayName: currentUser.displayName || 'Unknown',
        age: parseFloat(formData.age),
        uploadMethod: uploadMethod // Track which upload method was used
      };

      console.log('Saving pet data:', petData);

      if (editingPet) {
        await PetsService.updatePet(editingPet.id, petData);
      } else {
        const petId = await PetsService.createPet(petData);
        console.log('Pet created with ID:', petId);
      }

      onSuccess && onSuccess();

    } catch (error) {
      console.error('Error saving pet:', error);
      setError(error.message || 'Failed to save pet. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="add-pet-form">
      <div className="form-header">
        <h2>{editingPet ? 'Edit Pet' : 'Add New Pet'}</h2>
        <button onClick={onCancel} className="close-btn">&times;</button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Pet Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Pet Type *</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              {petTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="breed">Breed</label>
            <input
              type="text"
              id="breed"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              placeholder="e.g., Golden Retriever"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">Age (years) *</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="0"
              max="30"
              step="0.1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender *</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="bio">About Your Pet</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="3"
            maxLength={500}
            placeholder="Tell us about your pet's personality, likes, dislikes..."
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            {formData.bio.length}/500 characters
          </small>
        </div>

        <div className="form-group">
          <label>Personality Traits</label>
          <div className="personality-grid">
            {personalityTraits.map(trait => (
              <label key={trait} className="personality-checkbox">
                <input
                  type="checkbox"
                  checked={formData.personality.includes(trait)}
                  onChange={() => handlePersonalityToggle(trait)}
                />
                <span>{trait}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="image">Pet Photos</label>
          <input
            type="file"
            id="image"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleImageUpload}
            disabled={imageUploading || formData.images.length >= 5}
          />
          
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            • Maximum 5 images allowed
            • Supported formats: JPG, PNG, WebP
            • Maximum size: 5MB per image
            • Images will be automatically optimized
          </div>
          
          {imageUploading && (
            <div className="uploading">
              Uploading image... Please wait.
            </div>
          )}
          
          {formData.images.length >= 5 && (
            <p style={{ color: '#e67e22', fontSize: '14px', marginTop: '5px' }}>
              Maximum 5 images reached
            </p>
          )}
          
          {formData.images.length > 0 && (
            <div className="image-preview-grid">
              {formData.images.map((imageUrl, index) => (
                <div key={index} className="image-preview">
                  <img 
                    src={imageUrl} 
                    alt={`Pet ${index + 1}`}
                    onError={(e) => {
                      console.error('Failed to load image:', imageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-image-btn"
                    title="Remove image"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || imageUploading} 
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : editingPet ? 'Update Pet' : 'Add Pet'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPetForm;