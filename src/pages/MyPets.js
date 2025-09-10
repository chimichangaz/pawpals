// src/pages/MyPets.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PetsService } from '../services/pets.service';
import PetCard from '../components/pets/PetCard';
import AddPetForm from '../components/pets/AddPetForm';

function MyPets() {
  const { currentUser } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadPets();
    }
  }, [currentUser]);

  async function loadPets() {
    try {
      setLoading(true);
      const userPets = await PetsService.getPetsByOwner(currentUser.uid);
      setPets(userPets);
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePet(petId) {
    if (window.confirm('Are you sure you want to delete this pet?')) {
      try {
        await PetsService.deletePet(petId);
        setPets(pets.filter(pet => pet.id !== petId));
      } catch (error) {
        console.error('Error deleting pet:', error);
        alert('Failed to delete pet. Please try again.');
      }
    }
  }

  function handleEditPet(pet) {
    setEditingPet(pet);
    setShowAddForm(true);
  }

  function handleFormSuccess() {
    setShowAddForm(false);
    setEditingPet(null);
    loadPets(); // Reload pets after adding/editing
  }

  function handleFormCancel() {
    setShowAddForm(false);
    setEditingPet(null);
  }

  if (!currentUser) {
    return <div className="page-container">Please sign in to view your pets.</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Pets</h1>
        <button 
          onClick={() => setShowAddForm(true)} 
          className="btn btn-primary"
        >
          Add New Pet
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading your pets...</div>
      ) : (
        <>
          {pets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🐾</div>
              <h3>No pets yet!</h3>
              <p>Add your first pet to get started connecting with other pet owners.</p>
              <button 
                onClick={() => setShowAddForm(true)} 
                className="btn btn-primary"
              >
                Add Your First Pet
              </button>
            </div>
          ) : (
            <div className="pets-grid">
              {pets.map(pet => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onEdit={handleEditPet}
                  onDelete={handleDeletePet}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AddPetForm
              editingPet={editingPet}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPets;