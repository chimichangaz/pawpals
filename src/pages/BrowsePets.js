// src/pages/BrowsePets.js - FIXED to exclude current user's pets
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PetsService } from '../services/pets.service';
import PetCard from '../components/pets/PetCard';

function BrowsePets() {
  const { currentUser } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    search: ''
  });

  useEffect(() => {
    loadPets();
  }, [currentUser]);

  async function loadPets() {
    try {
      setLoading(true);
      const allPets = await PetsService.getAllPets();
      
      // Filter out current user's pets if user is logged in
      const otherUsersPets = currentUser 
        ? allPets.filter(pet => pet.ownerId !== currentUser.uid)
        : allPets;
      
      console.log('Total pets found:', allPets.length);
      console.log('Pets after filtering out own pets:', otherUsersPets.length);
      console.log('Current user ID:', currentUser?.uid);
      
      setPets(otherUsersPets);
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPets = pets.filter(pet => {
    const matchesType = !filters.type || pet.type === filters.type;
    const matchesSearch = !filters.search || 
      pet.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      pet.breed.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Browse Pets</h1>
          <p>Discover pets in your community</p>
        </div>
        {!currentUser && (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <a href="/login" style={{ color: 'var(--primary-orange)' }}>Sign in</a> to hide your own pets from this view
          </div>
        )}
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="filter-select"
          >
            <option value="">All Pet Types</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="bird">Birds</option>
            <option value="rabbit">Rabbits</option>
            <option value="hamster">Hamsters</option>
            <option value="fish">Fish</option>
            <option value="reptile">Reptiles</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by name or breed..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="filter-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading pets...</div>
      ) : (
        <>
          <div className="results-count">
            {filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''} found
            {currentUser && (
              <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                (your pets are hidden from this view)
              </span>
            )}
          </div>
          
          <div className="pets-grid">
            {filteredPets.map(pet => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>

          {filteredPets.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No pets found</h3>
              {currentUser ? (
                <div>
                  <p>No other pets match your search filters.</p>
                  <p>Try adjusting your search or check back later for new pets!</p>
                </div>
              ) : (
                <div>
                  <p>No pets match your search filters.</p>
                  <p>Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BrowsePets;