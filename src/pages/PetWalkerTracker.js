// src/pages/PetWalkTracker.js
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Play, Pause, Square, MapPin, Clock, Route, Zap, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PetWalkTracker = () => {
  const { currentUser } = useAuth();
  
  // Core tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [route, setRoute] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Walking statistics
  const [distance, setDistance] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [calories, setCalories] = useState(0);
  
  // Pet data - loaded from Firebase
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isLoadingPets, setIsLoadingPets] = useState(true);

  // Load user's pets from Firebase
  useEffect(() => {
    const loadUserPets = async () => {
      if (!currentUser) {
        setIsLoadingPets(false);
        return;
      }

      try {
        const petsQuery = query(
          collection(db, 'pets'),
          where('ownerId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(petsQuery);
        const pets = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUserPets(pets);
        
        // Auto-select first pet if available
        if (pets.length > 0 && !selectedPet) {
          setSelectedPet(pets[0]);
        }
      } catch (error) {
        console.error('Error loading pets:', error);
      } finally {
        setIsLoadingPets(false);
      }
    };

    loadUserPets();
  }, [currentUser, selectedPet]);
  
  // Refs and intervals
  const watchId = useRef(null);
  const timerInterval = useRef(null);
  const lastPosition = useRef(null);
  const lastTimestamp = useRef(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Calculate speed in km/h
  const calculateSpeed = (distance, timeInSeconds) => {
    return (distance / 1000) / (timeInSeconds / 3600);
  };

  // Calculate calories burned (simplified formula)
  const calculateCalories = (distanceKm, petWeight, timeHours) => {
    // Rough calculation: 0.5 calories per kg per km for dogs
    if (!petWeight) return 0;
    return Math.round(distanceKm * petWeight * 0.5);
  };

  // Get pet avatar based on pet data
  const getPetAvatar = (pet) => {
    if (pet.petType) {
      const avatars = {
        'dog': '🐕',
        'cat': '🐱', 
        'bird': '🐦',
        'rabbit': '🐰',
        'other': '🐾'
      };
      return avatars[pet.petType.toLowerCase()] || '🐾';
    }
    return '🐾';
  };

  // Start tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    const startTimestamp = Date.now();
    setStartTime(startTimestamp);
    setIsTracking(true);
    setIsPaused(false);
    setRoute([]);
    setDistance(0);
    setElapsedTime(0);
    setAverageSpeed(0);
    setMaxSpeed(0);
    setCalories(0);
    
    lastTimestamp.current = startTimestamp;

    // Start timer
    timerInterval.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Start position tracking
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = { lat: latitude, lng: longitude };
        const currentTimestamp = Date.now();

        setCurrentPosition(newPosition);

        if (lastPosition.current && !isPaused) {
          const segmentDistance = calculateDistance(
            lastPosition.current.lat,
            lastPosition.current.lng,
            latitude,
            longitude
          );

          // Only update if movement is significant (> 2 meters)
          if (segmentDistance > 2) {
            setRoute(prev => [...prev, newPosition]);
            setDistance(prev => {
              const newDistance = prev + segmentDistance;
              
              // Calculate speed for this segment
              const timeElapsed = (currentTimestamp - lastTimestamp.current) / 1000;
              if (timeElapsed > 0) {
                const segmentSpeed = calculateSpeed(segmentDistance, timeElapsed);
                setMaxSpeed(prev => Math.max(prev, segmentSpeed));
              }
              
              // Update calories
              const distanceKm = newDistance / 1000;
              const timeHours = elapsedTime / 3600;
              setCalories(calculateCalories(distanceKm, selectedPet?.weight, timeHours));
              
              return newDistance;
            });

            lastPosition.current = newPosition;
            lastTimestamp.current = currentTimestamp;
          }
        } else if (!lastPosition.current) {
          lastPosition.current = newPosition;
          setRoute([newPosition]);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please check your GPS settings.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      }
    );
  };

  // Pause tracking
  const pauseTracking = () => {
    setIsPaused(!isPaused);
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    setIsPaused(false);
    
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    lastPosition.current = null;
    lastTimestamp.current = null;
  };

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate average speed
  useEffect(() => {
    if (distance > 0 && elapsedTime > 0) {
      const avgSpeed = calculateSpeed(distance, elapsedTime);
      setAverageSpeed(avgSpeed);
    }
  }, [distance, elapsedTime]);

  // Get map center
  const getMapCenter = () => {
    if (currentPosition) return [currentPosition.lat, currentPosition.lng];
    if (route.length > 0) return [route[0].lat, route[0].lng];
    return [12.9716, 77.5946]; // Default to Bangalore
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header - matching Events page style */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-4xl">🚶‍♂️</span>
            Pet Walk Tracker
          </h1>
          <p className="text-gray-600 mt-2">
            Track your pet's walks with GPS precision and detailed statistics
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Pet Selection - Enhanced Visual Design */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-3 text-white">
              <span className="text-2xl">🐾</span>
              <div>
                <h2 className="text-xl font-semibold">Select Your Pet</h2>
                <p className="text-purple-100 text-sm">Choose which pet you're walking today</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {!currentUser ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign In Required</h3>
                <p className="text-gray-600">Please sign in to access your registered pets for walk tracking.</p>
              </div>
            ) : isLoadingPets ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">⏳</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Pets...</h3>
                <p className="text-gray-600">Fetching your registered pets from the database.</p>
              </div>
            ) : userPets.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🐕</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pets Registered</h3>
                <p className="text-gray-600 mb-4">You need to register your pets first before you can track walks.</p>
                <a 
                  href="/my-pets" 
                  className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Register Your Pets
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPet(pet)}
                    className={`group relative p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      selectedPet?.id === pet.id 
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg ring-4 ring-purple-100' 
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    {/* Selection indicator */}
                    {selectedPet?.id === pet.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                    
                    {/* Pet Avatar */}
                    <div className="text-center mb-4">
                      <div className="text-5xl mb-2 transform group-hover:scale-110 transition-transform duration-200">
                        {getPetAvatar(pet)}
                      </div>
                      <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mx-auto opacity-60"></div>
                    </div>
                    
                    {/* Pet Details */}
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{pet.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{pet.breed}</p>
                      <div className="flex justify-center gap-4 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded-full">
                          {pet.age ? `${pet.age} years` : 'Age not specified'}
                        </span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          {pet.weight ? `${pet.weight} kg` : 'Weight TBD'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Hover effect overlay */}
                    <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-200 ${
                      selectedPet?.id === pet.id ? 'bg-purple-500' : 'bg-indigo-500'
                    }`}></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Only show tracking interface if user has pets and one is selected */}
        {currentUser && userPets.length > 0 && selectedPet && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map Section - matching Events page style */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-green-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <span className="text-2xl">🗺️</span>
                    <div>
                      <h2 className="text-xl font-semibold">Live Walk Tracking</h2>
                      <p className="text-green-100 text-sm">
                        {isTracking 
                          ? `Tracking ${selectedPet.name}'s walk • Distance: ${(distance/1000).toFixed(2)}km`
                          : 'Ready to start tracking your walk'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div style={{ height: "500px" }} className="w-full">
                    <MapContainer
                      center={getMapCenter()}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      
                      {route.length > 1 && (
                        <Polyline 
                          positions={route} 
                          color="#10b981"
                          weight={4}
                          opacity={0.8}
                        />
                      )}
                      
                      {currentPosition && (
                        <Marker position={[currentPosition.lat, currentPosition.lng]}>
                          <Popup>
                            Current Location<br />
                            {selectedPet.name} is here!
                          </Popup>
                        </Marker>
                      )}
                      
                      {route.length > 0 && (
                        <Marker position={[route[0].lat, route[0].lng]}>
                          <Popup>Walk Start Point</Popup>
                        </Marker>
                      )}
                    </MapContainer>
                    
                    {!currentPosition && !isTracking && (
                      <div className="absolute top-4 left-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-800">
                          <MapPin size={20} />
                          <div>
                            <h3 className="font-semibold">Ready to Track</h3>
                            <p className="text-sm">Click "Start Walk" to begin GPS tracking</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls and Stats - matching form container style */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Control Panel */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                    <h3 className="text-xl font-semibold text-white">Walk Controls</h3>
                  </div>
                  <div className="p-6">
                    {!isTracking ? (
                      <button
                        onClick={startTracking}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <Play size={20} />
                        Start Walk with {selectedPet?.name || 'Pet'}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <button
                          onClick={pauseTracking}
                          className={`w-full font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 ${
                            isPaused 
                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }`}
                        >
                          {isPaused ? <Play size={16} /> : <Pause size={16} />}
                          {isPaused ? 'Resume Walk' : 'Pause Walk'}
                        </button>
                        <button
                          onClick={stopTracking}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <Square size={16} />
                          Stop Walk
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Panel */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
                    <h3 className="text-xl font-semibold text-white">Walk Statistics</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <Clock size={24} className="text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {formatTime(elapsedTime)}
                        </div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <Route size={24} className="text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {(distance / 1000).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Distance (km)</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <Zap size={24} className="text-orange-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {averageSpeed.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">Avg Speed (km/h)</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <Heart size={24} className="text-red-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {calories}
                        </div>
                        <div className="text-sm text-gray-600">Calories</div>
                      </div>
                    </div>
                    
                    {maxSpeed > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm text-blue-800">
                          🏃‍♂️ Max Speed: <span className="font-semibold">{maxSpeed.toFixed(1)} km/h</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pet Info Panel */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                    <h3 className="text-xl font-semibold text-white">Walking with</h3>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{getPetAvatar(selectedPet)}</span>
                      <div>
                        <div className="text-xl font-bold text-gray-900 mb-1">
                          {selectedPet?.name || 'No pet selected'}
                        </div>
                        <div className="text-gray-600 mb-1">
                          {selectedPet?.breed || 'Unknown breed'}
                        </div>
                        <div className="text-sm text-purple-600 font-medium">
                          Weight: {selectedPet?.weight || 'Not specified'} kg
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetWalkTracker;