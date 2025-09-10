// src/pages/BrowsePets.js
import React, { useState, useEffect } from 'react';
import { PetsService } from '../services/pets.service';
import PetCard from '../components/pets/PetCard';

function BrowsePets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    search: ''
  });

  useEffect(() => {
    loadPets();
  }, []);

  async function loadPets() {
    try {
      setLoading(true);
      const allPets = await PetsService.getAllPets();
      setPets(allPets);
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
        <h1>Browse Pets</h1>
        <p>Discover pets in your community</p>
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
              <p>Try adjusting your search filters.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BrowsePets;