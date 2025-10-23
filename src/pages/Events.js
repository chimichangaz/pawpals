import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
  orderBy,
  getDocs,
  writeBatch,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { sendEmailVerification } from "firebase/auth";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for event markers (red)
const eventIcon = L.divIcon({
  className: 'custom-event-marker',
  html: '<div style="background-color: #ef4444; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 5px; margin-left: 7px; font-size: 16px;">📍</div></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Custom icon for selected location (green)
const selectedIcon = L.divIcon({
  className: 'custom-selected-marker',
  html: '<div style="background-color: #22c55e; width: 35px; height: 35px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 3px 7px rgba(0,0,0,0.4);"><div style="transform: rotate(45deg); margin-top: 6px; margin-left: 8px; font-size: 18px;">✅</div></div>',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35]
});

// Verification Banner Component
const VerificationBanner = ({ currentUser, onVerifyEmail }) => {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (currentUser) {
      checkUserProfile();
    }
  }, [currentUser]);

  const checkUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
    }
  };

  const needsVerification = !currentUser?.emailVerified || !userProfile?.displayName;

  if (!needsVerification || !currentUser) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🔒</div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800">Complete Your Verification</h3>
              <p className="text-amber-700 text-sm">
                Verify your account to unlock all event features and build trust in the community.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!currentUser.emailVerified && (
              <button
                onClick={onVerifyEmail}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Verify Email
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {!currentUser.emailVerified && (
            <div className="flex items-center gap-2 text-amber-700">
              <div className={`w-3 h-3 rounded-full ${currentUser.emailVerified ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span>Email Verification {currentUser.emailVerified ? '✓' : ''}</span>
            </div>
          )}
          
          {userProfile && (
            <div className="flex items-center gap-2 text-amber-700">
              <div className={`w-3 h-3 rounded-full ${userProfile?.displayName ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span>Full Name {userProfile?.displayName ? '✓' : ''}</span>
            </div>
          )}
        </div>

        {!userProfile?.displayName && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>Add your full name:</strong> Go to your profile to add your name so other members can recognize you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoized Event Card Component
const EventCard = React.memo(({ ev, idx, currentUser, onEnroll, onUnenroll, isEnrolling }) => {
  const eventImages = [
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop&q=80'
  ];
  const imageUrl = ev.image || eventImages[idx % eventImages.length];
  
  const isEnrolled = currentUser && ev.enrolledUsers && 
    ev.enrolledUsers.some(user => user.userId === currentUser.uid);
  
  const enrolledCount = ev.enrolledUsers ? ev.enrolledUsers.length : 0;
  const displayEnrolledUsers = ev.enrolledUsers ? ev.enrolledUsers.slice(0, 3) : [];

  const getDisplayName = (user) => {
    if (!user) return 'Unknown';
    return user.displayName || (user.email ? user.email.split('@')[0] : 'User');
  };

  const getHostDisplayName = (email) => {
    if (!email) return 'Unknown';
    return email.split('@')[0];
  };

  const canEnroll = currentUser?.emailVerified;

  return (
    <article className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2">
      <div className="relative h-64 overflow-hidden bg-gray-900">
        <img 
          src={imageUrl}
          alt={ev.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {ev.datetime?.toDate ? ev.datetime.toDate().getDate() : '?'}
            </div>
            <div className="text-xs font-medium text-gray-600 uppercase">
              {ev.datetime?.toDate ? ev.datetime.toDate().toLocaleDateString('en-US', { month: 'short' }) : 'TBD'}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">
              {ev.coords?.lat ? ev.coords.lat.toFixed(2) : '0.00'}, {ev.coords?.lng ? ev.coords.lng.toFixed(2) : '0.00'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
            {ev.name || "Untitled Event"}
          </h3>
        </div>
      </div>

      <div className="p-5 bg-white">
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {ev.description || "No description provided."}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-700 text-sm">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">
              {ev.datetime?.toDate ? ev.datetime.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{enrolledCount} enrolled</span>
            </div>
            
            {currentUser && ev.createdby !== currentUser.email && (
              <>
                {canEnroll ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEnrolled) {
                        onUnenroll(ev.id);
                      } else {
                        onEnroll(ev.id);
                      }
                    }}
                    disabled={isEnrolling[ev.id]}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isEnrolled 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isEnrolling[ev.id] ? '...' : isEnrolled ? 'Unenroll' : 'Enroll'}
                  </button>
                ) : (
                  <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
                    Verify to enroll
                  </div>
                )}
              </>
            )}
            
            {currentUser && ev.createdby === currentUser.email && (
              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                Your Event
              </span>
            )}
          </div>

          {displayEnrolledUsers.length > 0 && (
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1 mb-1">
                <span>Enrolled:</span>
                <div className="flex flex-wrap gap-1">
                  {displayEnrolledUsers.map((user, index) => (
                    <span key={index} className="bg-gray-100 px-2 py-1 rounded-md">
                      {getDisplayName(user)}
                    </span>
                  ))}
                  {enrolledCount > 3 && (
                    <span className="bg-gray-100 px-2 py-1 rounded-md">
                      +{enrolledCount - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {ev.createdby ? ev.createdby[0].toUpperCase() : 'U'}
              </div>
              <div className="text-xs text-gray-500">
                Host: <span className="font-medium text-gray-700">{getHostDisplayName(ev.createdby)}</span>
              </div>
            </div>
            
            <button className="text-indigo-600 hover:text-indigo-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500 rounded-2xl transition-all duration-300 pointer-events-none"></div>
    </article>
  );
});

// Map Click Handler Component
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lng, address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}` });
    },
  });
  return null;
};

// Location Picker Component for Leaflet
const LocationPicker = ({ onLocationSelect, selectedLocation, events }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const mapRef = useRef(null);

  console.log("LocationPicker received events:", events); // Debug log

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      // Using Nominatim (OpenStreetMap's geocoding service) - Free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
        alert("No results found. Try a different search term.");
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      alert("Error searching for location. Please try again.");
    }
  };

  const handleResultClick = (result) => {
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name
    };
    onLocationSelect(location);
    setSearchResults([]);
    setSearchQuery(result.display_name);

    // Pan map to selected location
    if (mapRef.current) {
      mapRef.current.setView([location.lat, location.lng], 14);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a location (e.g., Cubbon Park, Bangalore)..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg max-h-48 overflow-y-auto shadow-md">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="p-3 border-b border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors"
              onClick={() => handleResultClick(result)}
            >
              <div className="font-medium text-sm text-gray-800">{result.display_name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Leaflet Map */}
      <div className="rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg" style={{ height: '400px', width: '100%', position: 'relative', zIndex: 1 }}>
        <MapContainer 
          center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [12.9716, 77.5946]} 
          zoom={selectedLocation ? 14 : 11}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler onLocationSelect={onLocationSelect} />
          
          {/* Show all event markers */}
          {events && events.length > 0 && events.map((event, index) => {
            console.log("Rendering marker for event:", event.name, event.coords); // Debug log
            return event.coords && event.coords.lat && event.coords.lng ? (
              <Marker 
                key={event.id} 
                position={[event.coords.lat, event.coords.lng]}
                icon={eventIcon}
              >
                <Popup>
                  <div style={{ minWidth: '150px' }}>
                    <strong style={{ color: '#4f46e5', fontSize: '14px' }}>{event.name}</strong><br />
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>
                      {event.datetime?.toDate ? event.datetime.toDate().toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Date TBD'}
                    </span><br />
                    {event.address && (
                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>{event.address}</span>
                    )}
                  </div>
                </Popup>
              </Marker>
            ) : null;
          })}
          
          {/* Show selected location marker */}
          {selectedLocation && (
            <Marker 
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={selectedIcon}
            >
              <Popup>
                <strong>Selected Location</strong><br />
                {selectedLocation.address}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-700 flex items-center gap-2">
                <span className="text-lg">📍</span>
                Location Selected
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
              </div>
              {selectedLocation.address && (
                <div className="text-xs text-gray-700 mt-1 font-medium">{selectedLocation.address}</div>
              )}
            </div>
            <button
              onClick={() => onLocationSelect(null)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center bg-blue-50 p-2 rounded">
        💡 <strong>Click anywhere on the map</strong> to select coordinates, or use the search bar above<br/>
        🔴 Red pins = Existing events ({events?.length || 0}) | 🟢 Green pin = Your selected location
      </div>
    </div>
  );
};

export default function Events() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ 
    name: "", 
    description: "", 
    datetime: "", 
    location: null 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState({});
  const [cleanupStats, setCleanupStats] = useState({ cleaned: 0, lastCleanup: null });
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  // Email verification function
  const handleVerifyEmail = async () => {
    if (!currentUser) return;
    
    try {
      await sendEmailVerification(currentUser);
      alert("Verification email sent! Please check your inbox and verify your email address.");
    } catch (error) {
      console.error("Error sending verification email:", error);
      alert("Error sending verification email. Please try again.");
    }
  };

  // Check if user needs verification when trying to create event
  const checkUserVerification = () => {
    if (!currentUser?.emailVerified) {
      setShowVerificationAlert(true);
      return false;
    }
    return true;
  };

  // cleanup past events older than 1 hour
  const cleanupPastEvents = async () => {
    try {
      const buffer = new Date();
      buffer.setHours(buffer.getHours() - 1);
      const cutoff = Timestamp.fromDate(buffer);
      const pastQ = query(
        collection(db, "events"), 
        where("datetime", "<", cutoff),
        orderBy("datetime")
      );
      const snap = await getDocs(pastQ);
      if (snap.empty) return 0;
      const batch = writeBatch(db);
      let count = 0;
      snap.forEach((s) => {
        batch.delete(doc(db, "events", s.id));
        count++;
      });
      await batch.commit();
      setCleanupStats({ cleaned: count, lastCleanup: new Date().toLocaleString() });
      return count;
    } catch (err) {
      console.error("cleanup error", err);
      return 0;
    }
  };

  const handleManualCleanup = async () => {
    const count = await cleanupPastEvents();
    alert(`Cleanup complete! Removed ${count} past events.`);
  };

  useEffect(() => {
    cleanupPastEvents();
    const now = Timestamp.now();
    const q = query(
      collection(db, "events"), 
      where("datetime", ">", now), 
      orderBy("datetime", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(arr);
    });
    const interval = setInterval(cleanupPastEvents, 30 * 60 * 1000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleLocationSelect = (location) => {
    setNewEvent(prev => ({ 
      ...prev, 
      location 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!checkUserVerification()) {
      return;
    }
    
    if (!currentUser) return alert("Please sign in to create an event.");
    if (!newEvent.location) return alert("Please select a location.");
    const eventDate = new Date(newEvent.datetime);
    if (eventDate <= new Date()) return alert("Please choose a future date/time.");
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "events"), {
        name: newEvent.name,
        description: newEvent.description,
        datetime: Timestamp.fromDate(eventDate),
        coords: { 
          lat: newEvent.location.lat, 
          lng: newEvent.location.lng 
        },
        address: newEvent.location.address,
        createdby: currentUser.email,
        createdAt: serverTimestamp(),
        enrolledUsers: [],
      });
      setNewEvent({ name: "", description: "", datetime: "", location: null });
      alert("Event created successfully!");
    } catch (err) {
      console.error(err);
      alert("Error creating event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnroll = async (eventId) => {
    if (!currentUser) {
      alert("Please sign in to enroll in events.");
      return;
    }

    if (!currentUser.emailVerified) {
      alert("Please verify your email address before enrolling in events.");
      return;
    }

    const event = events.find(ev => ev.id === eventId);
    if (event && event.enrolledUsers) {
      const isAlreadyEnrolled = event.enrolledUsers.some(
        user => user.userId === currentUser.uid
      );
      if (isAlreadyEnrolled) {
        alert("You're already enrolled in this event!");
        return;
      }
    }

    if (event && event.createdby === currentUser.email) {
      alert("You're the host of this event!");
      return;
    }

    if (event && event.enrolledUsers && event.enrolledUsers.length >= 100) {
      alert("This event is full!");
      return;
    }

    setIsEnrolling(prev => ({ ...prev, [eventId]: true }));

    try {
      const eventRef = doc(db, "events", eventId);
      const enrollmentData = {
        userId: currentUser.uid,
        email: currentUser.email,
        enrolledAt: new Date(),
        displayName: currentUser.displayName || currentUser.email.split('@')[0]
      };
      
      await updateDoc(eventRef, {
        enrolledUsers: arrayUnion(enrollmentData)
      });
      alert("Successfully enrolled in event!");
    } catch (error) {
      console.error("Error enrolling:", error);
      alert("Error enrolling in event");
    } finally {
      setIsEnrolling(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleUnenroll = async (eventId) => {
    if (!currentUser) return;

    setIsEnrolling(prev => ({ ...prev, [eventId]: true }));

    try {
      const eventRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventRef);
      const eventData = eventDoc.data();
      
      if (!eventData || !eventData.enrolledUsers) {
        alert("No enrollment found to remove.");
        return;
      }
      
      const userEnrollment = eventData.enrolledUsers.find(
        user => user.userId === currentUser.uid
      );
      
      if (userEnrollment) {
        await updateDoc(eventRef, {
          enrolledUsers: arrayRemove(userEnrollment)
        });
        alert("Successfully unenrolled from event!");
      } else {
        alert("You are not enrolled in this event.");
      }
    } catch (error) {
      console.error("Error unenrolling:", error);
      alert("Error unenrolling from event");
    } finally {
      setIsEnrolling(prev => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="pt-16"></div>
      
      {/* Verification Banner */}
      <VerificationBanner currentUser={currentUser} onVerifyEmail={handleVerifyEmail} />

      {/* Verification Alert Modal */}
      {showVerificationAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Verification Required</h3>
              <p className="text-gray-600 mb-6">
                Please verify your email address to create events and enroll in community activities. 
                This helps build trust and security in our pet community.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleVerifyEmail}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Send Verification Email
                </button>
                <button
                  onClick={() => setShowVerificationAlert(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header hero */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🐶</span>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">Community Pet Events</h1>
              <p className="text-gray-600 mt-2">Discover and host friendly, pet-focused events — meetups, playdates, training sessions and more.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <div className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">Auto-cleanup enabled</div>
            <div className="text-sm text-gray-500">Upcoming: <span className="font-semibold text-gray-700">{events.length}</span></div>
            {currentUser?.emailVerified && (
              <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">Email Verified</div>
            )}
            {cleanupStats.lastCleanup && (
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                Last cleanup: {cleanupStats.lastCleanup} • Cleaned: {cleanupStats.cleaned}
              </div>
            )}
            <button
              onClick={handleManualCleanup}
              className="ml-auto px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 text-sm font-medium"
            >
              <span className="text-base">🗑️</span>
              Manual Cleanup
            </button>
          </div>
        </div>

        {/* Events cards */}
        {events.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev, idx) => (
                <EventCard 
                  key={ev.id} 
                  ev={ev} 
                  idx={idx} 
                  currentUser={currentUser}
                  onEnroll={handleEnroll}
                  onUnenroll={handleUnenroll}
                  isEnrolling={isEnrolling}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content - Form and Map */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Form card */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-32">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-3">Create New Event</h2>
              <p className="text-sm text-gray-500 mb-4">Search for a location on the map, then fill the form and publish.</p>

              {!currentUser?.emailVerified && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Verify your email to create events</span>
                  </div>
                  <button
                    onClick={handleVerifyEmail}
                    className="mt-2 w-full bg-amber-500 text-white py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors"
                  >
                    Send Verification Email
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    required
                    placeholder="Dog Park Meetup"
                    disabled={!currentUser?.emailVerified}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    rows={3}
                    required
                    placeholder="Bring toys, water and smiles"
                    disabled={!currentUser?.emailVerified}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={newEvent.datetime}
                    onChange={(e) => setNewEvent({ ...newEvent, datetime: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                    disabled={!currentUser?.emailVerified}
                  />
                  <small className="text-xs text-gray-500">Must be a future date</small>
                </div>

                <div className="flex gap-3">
                  <button 
                    disabled={isSubmitting || !currentUser?.emailVerified} 
                    type="submit" 
                    className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 font-semibold shadow disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create Event"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setNewEvent({ name: "", description: "", datetime: "", location: null })} 
                    className="rounded-xl bg-white border px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="mt-6 text-xs text-gray-500 pt-4 border-t border-gray-100">
                <div>Auto cleanup: <span className="font-medium text-gray-700">{cleanupStats.cleaned}</span> deleted</div>
                {cleanupStats.lastCleanup && <div className="mt-1">Last: {cleanupStats.lastCleanup}</div>}
                <button onClick={cleanupPastEvents} className="mt-3 text-sm text-red-600 hover:text-red-700">Run cleanup now</button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Leaflet Map Location Picker */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <span className="text-2xl">🗺️</span>
                <div>
                  <h2 className="text-xl font-semibold">Select Event Location</h2>
                  <p className="text-blue-100 text-sm">Search for a location or browse the map • Showing <strong>{events.length}</strong> upcoming events</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <LocationPicker 
                onLocationSelect={handleLocationSelect}
                selectedLocation={newEvent.location}
                events={events}
              />
            </div>
          </div>

          {/* Events Location Legend */}
          {events.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Event Locations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((event, index) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm truncate">{event.name}</div>
                      <div className="text-gray-600 text-xs">
                        {event.datetime?.toDate ? event.datetime.toDate().toLocaleDateString() : 'Date TBD'}
                      </div>
                      {event.address && (
                        <div className="text-gray-500 text-xs line-clamp-2 mt-1">{event.address}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}