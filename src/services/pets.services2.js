// src/services/pets.service.js
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc 
} from 'firebase/firestore';
import { db } from './firebase';

export const petsService = {
  // Fetch all pets from Firestore
  async getAllPets() {
    try {
      const petsCollection = collection(db, 'pets');
      const querySnapshot = await getDocs(petsCollection);
      
      const pets = [];
      querySnapshot.forEach((doc) => {
        pets.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return pets;
    } catch (error) {
      console.error('Error fetching pets:', error);
      throw error;
    }
  },

  // Fetch pets by type (dog, cat, etc.)
  async getPetsByType(petType) {
    try {
      const petsCollection = collection(db, 'pets');
      const q = query(
        petsCollection, 
        where('type', '==', petType.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      
      const pets = [];
      querySnapshot.forEach((doc) => {
        pets.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return pets;
    } catch (error) {
      console.error('Error fetching pets by type:', error);
      throw error;
    }
  },

  // Fetch pets by personality traits
  async getPetsByPersonality(traits) {
    try {
      const petsCollection = collection(db, 'pets');
      // Note: Firestore array-contains only works with one value
      // For multiple traits, we'll fetch all and filter client-side
      const querySnapshot = await getDocs(petsCollection);
      
      const pets = [];
      querySnapshot.forEach((doc) => {
        const petData = { id: doc.id, ...doc.data() };
        
        // Check if pet has any of the desired traits
        if (petData.personality && Array.isArray(petData.personality)) {
          const hasMatchingTrait = traits.some(trait => 
            petData.personality.some(petTrait => 
              petTrait.toLowerCase() === trait.toLowerCase()
            )
          );
          
          if (hasMatchingTrait) {
            pets.push(petData);
          }
        }
      });
      
      return pets;
    } catch (error) {
      console.error('Error fetching pets by personality:', error);
      throw error;
    }
  },

  // Get recommended pets based on multiple criteria
  async getRecommendedPets(criteria = {}) {
    try {
      let pets = await this.getAllPets();
      
      // Filter by type if specified
      if (criteria.type) {
        pets = pets.filter(pet => 
          pet.type && pet.type.toLowerCase() === criteria.type.toLowerCase()
        );
      }
      
      // Filter by personality traits if specified
      if (criteria.personality && criteria.personality.length > 0) {
        pets = pets.filter(pet => {
          if (!pet.personality || !Array.isArray(pet.personality)) return false;
          
          return criteria.personality.some(trait => 
            pet.personality.some(petTrait => 
              petTrait.toLowerCase() === trait.toLowerCase()
            )
          );
        });
      }
      
      // Filter by owner location if specified (if you have location data)
      if (criteria.location && pets.some(pet => pet.location)) {
        pets = pets.filter(pet => 
          pet.location && pet.location.toLowerCase().includes(criteria.location.toLowerCase())
        );
      }
      
      // Sort by most recent updates
      pets.sort((a, b) => {
        if (a.updatedAt && b.updatedAt) {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        }
        return 0;
      });
      
      // Return top matches
      return pets.slice(0, criteria.limit || 5);
    } catch (error) {
      console.error('Error getting recommended pets:', error);
      throw error;
    }
  },

  // Get a specific pet by ID
  async getPetById(petId) {
    try {
      const petDoc = doc(db, 'pets', petId);
      const petSnapshot = await getDoc(petDoc);
      
      if (petSnapshot.exists()) {
        return {
          id: petSnapshot.id,
          ...petSnapshot.data()
        };
      } else {
        throw new Error('Pet not found');
      }
    } catch (error) {
      console.error('Error fetching pet by ID:', error);
      throw error;
    }
  },

  // Search pets by name or owner name
  async searchPets(searchTerm) {
    try {
      const pets = await this.getAllPets();
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      return pets.filter(pet => 
        (pet.name && pet.name.toLowerCase().includes(lowerSearchTerm)) ||
        (pet.ownerDisplayName && pet.ownerDisplayName.toLowerCase().includes(lowerSearchTerm)) ||
        (pet.type && pet.type.toLowerCase().includes(lowerSearchTerm))
      );
    } catch (error) {
      console.error('Error searching pets:', error);
      throw error;
    }
  }
};