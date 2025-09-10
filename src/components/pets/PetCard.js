// src/components/pets/PetCard.js
import React from 'react';

function PetCard({ pet, onEdit, onDelete, showActions = false }) {
  const getAgeDisplay = (age) => {
    if (age < 1) return `${Math.floor(age * 12)} months`;
    return `${Math.floor(age)} year${Math.floor(age) !== 1 ? 's' : ''}`;
  };

  return (
    <div className="pet-card">
      <div className="pet-image-container">
        {pet.images && pet.images.length > 0 ? (
          <img 
            src={pet.images[0]} 
            alt={pet.name}
            className="pet-image"
            onError={(e) => {
              e.target.src = '/api/placeholder/300/300';
            }}
          />
        ) : (
          <div className="pet-placeholder">
            <span className="pet-emoji">🐾</span>
          </div>
        )}
      </div>
      
      <div className="pet-info">
        <h3 className="pet-name">{pet.name}</h3>
        <div className="pet-details">
          <span className="pet-type">{pet.type}</span>
          {pet.breed && <span className="pet-breed">• {pet.breed}</span>}
        </div>
        <div className="pet-meta">
          <span className="pet-age">{getAgeDisplay(pet.age)}</span>
          <span className="pet-gender">• {pet.gender}</span>
        </div>
        
        {pet.personality && pet.personality.length > 0 && (
          <div className="pet-personality">
            {pet.personality.slice(0, 3).map((trait, index) => (
              <span key={index} className="personality-tag">{trait}</span>
            ))}
          </div>
        )}
        
        {pet.bio && (
          <p className="pet-bio">{pet.bio}</p>
        )}
      </div>
      
      {showActions && (
        <div className="pet-actions">
          <button onClick={() => onEdit(pet)} className="btn btn-secondary">
            Edit
          </button>
          <button onClick={() => onDelete(pet.id)} className="btn btn-danger">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default PetCard;