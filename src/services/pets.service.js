// src/services/pets.service.js - IMPROVED VERSION
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export class PetsService {
  // Create a new pet
  static async createPet(petData) {
    try {
      console.log('PetsService: Creating pet with data:', petData);
      
      // Validate required fields
      if (!petData.ownerId) {
        throw new Error('Owner ID is required');
      }
      if (!petData.name || !petData.name.trim()) {
        throw new Error('Pet name is required');
      }

      const petToSave = {
        ...petData,
        name: petData.name.trim(),
        breed: petData.breed?.trim() || '',
        bio: petData.bio?.trim() || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'pets'), petToSave);
      console.log('PetsService: Pet created successfully with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('PetsService: Error creating pet:', error);
      throw new Error(`Failed to create pet: ${error.message}`);
    }
  }

  // Get pets by owner ID
  static async getPetsByOwner(ownerId) {
    try {
      console.log('PetsService: Fetching pets for owner:', ownerId);
      
      if (!ownerId) {
        throw new Error('Owner ID is required');
      }

      const q = query(
        collection(db, 'pets'), 
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const pets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('PetsService: Found', pets.length, 'pets for owner:', ownerId);
      console.log('PetsService: Pet data:', pets);
      
      return pets;
    } catch (error) {
      console.error('PetsService: Error fetching pets by owner:', error);
      
      // If the error is due to missing index, try without orderBy
      if (error.code === 'failed-precondition') {
        console.log('PetsService: Retrying without orderBy due to missing index...');
        try {
          const q = query(
            collection(db, 'pets'), 
            where('ownerId', '==', ownerId)
          );
          const querySnapshot = await getDocs(q);
          const pets = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort manually by createdAt if available
          pets.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          
          console.log('PetsService: Retry successful, found', pets.length, 'pets');
          return pets;
        } catch (retryError) {
          console.error('PetsService: Retry also failed:', retryError);
          throw new Error(`Failed to fetch pets: ${retryError.message}`);
        }
      }
      
      throw new Error(`Failed to fetch pets: ${error.message}`);
    }
  }

  // Update pet
  static async updatePet(petId, petData) {
    try {
      console.log('PetsService: Updating pet', petId, 'with data:', petData);
      
      if (!petId) {
        throw new Error('Pet ID is required');
      }

      const updateData = {
        ...petData,
        name: petData.name?.trim(),
        breed: petData.breed?.trim() || '',
        bio: petData.bio?.trim() || '',
        updatedAt: serverTimestamp()
      };

      const petRef = doc(db, 'pets', petId);
      await updateDoc(petRef, updateData);
      
      console.log('PetsService: Pet updated successfully:', petId);
    } catch (error) {
      console.error('PetsService: Error updating pet:', error);
      throw new Error(`Failed to update pet: ${error.message}`);
    }
  }

  // Delete pet
  static async deletePet(petId) {
    try {
      console.log('PetsService: Deleting pet:', petId);
      
      if (!petId) {
        throw new Error('Pet ID is required');
      }

      await deleteDoc(doc(db, 'pets', petId));
      console.log('PetsService: Pet deleted successfully:', petId);
    } catch (error) {
      console.error('PetsService: Error deleting pet:', error);
      throw new Error(`Failed to delete pet: ${error.message}`);
    }
  }

  // Get all pets (for browsing/matching)
  static async getAllPets(limit = 50) {
    try {
      console.log('PetsService: Fetching all pets...');
      
      const q = query(
        collection(db, 'pets'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const pets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('PetsService: Found', pets.length, 'total pets');
      
      // Apply limit if specified
      const limitedPets = limit ? pets.slice(0, limit) : pets;
      
      return limitedPets;
    } catch (error) {
      console.error('PetsService: Error fetching all pets:', error);
      
      // If the error is due to missing index, try without orderBy
      if (error.code === 'failed-precondition') {
        console.log('PetsService: Retrying without orderBy due to missing index...');
        try {
          const querySnapshot = await getDocs(collection(db, 'pets'));
          const pets = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort manually by createdAt if available
          pets.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          
          console.log('PetsService: Retry successful, found', pets.length, 'pets');
          const limitedPets = limit ? pets.slice(0, limit) : pets;
          return limitedPets;
        } catch (retryError) {
          console.error('PetsService: Retry also failed:', retryError);
          throw new Error(`Failed to fetch all pets: ${retryError.message}`);
        }
      }
      
      throw new Error(`Failed to fetch all pets: ${error.message}`);
    }
  }

  // Debug function to check if pets exist for a user
  static async debugUserPets(ownerId) {
    try {
      console.log('=== DEBUGGING USER PETS ===');
      console.log('Owner ID:', ownerId);
      
      // Get all pets first
      const allPetsSnapshot = await getDocs(collection(db, 'pets'));
      const allPets = allPetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Total pets in database:', allPets.length);
      console.log('All pets:', allPets);
      
      // Filter by owner
      const userPets = allPets.filter(pet => pet.ownerId === ownerId);
      console.log('User pets found:', userPets.length);
      console.log('User pets data:', userPets);
      
      return { allPets, userPets };
    } catch (error) {
      console.error('Debug error:', error);
      return { allPets: [], userPets: [] };
    }
  }
}