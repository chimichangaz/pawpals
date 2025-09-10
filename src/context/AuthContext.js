// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Sign up function
  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, { displayName });
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName,
      profileImage: '',
      bio: '',
      location: {
        city: '',
        state: '',
        coordinates: null
      },
      interests: [],
      createdAt: new Date(),
      lastActive: new Date()
    });
    
    return userCredential;
  }

  // Login function
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout function
  function logout() {
    return signOut(auth);
  }

  // Get user profile from Firestore
  async function getUserProfile(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      setUserProfile(userDoc.data());
      return userDoc.data();
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await getUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    getUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}