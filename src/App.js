// src/App.js - Updated with Pet Walk Tracker route
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Events from './pages/Events';
import PetWalkTracker from './pages/PetWalkerTracker';  // ✅ New Pet Walk Tracker
import MyPets from './pages/MyPets';
import BrowsePets from './pages/BrowsePets';
import Forum from './pages/Forum';
import VetClinics from './pages/VetClinics';          // ✅ Import Vet Clinics
import PetVideos from './pages/PetVideos';           // ✅ Import Pet Videos
import FAQ from './pages/FAQ';                       // ✅ Import FAQ
import './App.css';
import './styles/base.css';
import './styles/pets.css';
import './styles/forum.css';
import PetChatbot from './components/PetChatbot';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/events" element={<Events />} />
              <Route path="/pet-walk-tracker" element={<PetWalkTracker />} /> {/* ✅ New Walk Tracker route */}
              <Route path="/vetclinics" element={<VetClinics />} /> {/* ✅ Vet Clinics route */}
              <Route path="/pet-videos" element={<PetVideos />} /> {/* ✅ Pet Videos route */}
              <Route path="/my-pets" element={<MyPets />} />
              <Route path="/browse-pets" element={<BrowsePets />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/faq" element={<FAQ />} /> {/* ✅ FAQ route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
           
          {/* ✅ Floating chatbot button */}
          <PetChatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;