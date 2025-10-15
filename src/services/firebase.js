import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth'; // 👈 add GithubAuthProvider
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC0t0gnsvtWT81NvOjbOcxgQah-fcZJE08",
  authDomain: "pawpals-79ae9.firebaseapp.com",
  projectId: "pawpals-79ae9",
  storageBucket: "pawpals-79ae9.firebasestorage.app",
  messagingSenderId: "49441092290",
  appId: "1:49441092290:web:c9856df756ca5545c6415b",
  measurementId: "G-TPY6ERJ7M9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider(); // 👈 add this line
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
