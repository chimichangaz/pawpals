// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '../services/firebase'; // ✅ added githubProvider

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Email/password sign up
  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName,
      profileImage: '',
      bio: '',
      location: { city: '', state: '', coordinates: null },
      interests: [],
      createdAt: new Date(),
      lastActive: new Date()
    });

    return userCredential;
  }

  // Email/password login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
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

  // ✅ Helper to create user profile if new
  async function ensureUserProfile(user) {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const newProfile = {
        email: user.email,
        displayName: user.displayName || '',
        profileImage: user.photoURL || '',
        bio: '',
        location: { city: '', state: '', coordinates: null },
        interests: [],
        createdAt: new Date(),
        lastActive: new Date()
      };
      await setDoc(userDocRef, newProfile);
      setUserProfile(newProfile);
    } else {
      setUserProfile(userDoc.data());
    }
  }

  // ✅ Google Sign-In
  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await ensureUserProfile(user);
      setCurrentUser(user);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  // ✅ GitHub Sign-In
  async function signInWithGitHub() {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      await ensureUserProfile(user);
      setCurrentUser(user);
    } catch (error) {
      console.error('GitHub sign-in error:', error);
      throw error;
    }
  }

  // Auth state listener
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
    getUserProfile,
    signInWithGoogle,
    signInWithGitHub // ✅ added GitHub login
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
