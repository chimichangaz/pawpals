// src/App.js - Updated with Forum route
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Events from './pages/Events';
import MyPets from './pages/MyPets';
import BrowsePets from './pages/BrowsePets';
import Forum from './pages/Forum';  // ✅ Added Forum import
import './App.css';
import './styles/pets.css';

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
              <Route path="/my-pets" element={<MyPets />} />
              <Route path="/browse-pets" element={<BrowsePets />} />
              <Route path="/forum" element={<Forum />} /> {/* ✅ Added Forum route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
