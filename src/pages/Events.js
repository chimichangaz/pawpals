import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
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

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// icons
const eventIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const newEventIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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
            {/* Email Verification Status */}
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

        {/* Verification Requirements */}
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

        {/* Full Name Reminder */}
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
  
  // Get first few enrolled users for display - with safe access
  const displayEnrolledUsers = ev.enrolledUsers ? ev.enrolledUsers.slice(0, 3) : [];

  // Safe function to get display name
  const getDisplayName = (user) => {
    if (!user) return 'Unknown';
    return user.displayName || (user.email ? user.email.split('@')[0] : 'User');
  };

  // Safe function to get host display name
  const getHostDisplayName = (email) => {
    if (!email) return 'Unknown';
    return email.split('@')[0];
  };

  // Check if user can enroll (verified email)
  const canEnroll = currentUser?.emailVerified;

  return (
    <article 
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden bg-gray-900">
        <img 
          src={imageUrl}
          alt={ev.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Date Badge */}
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

        {/* Bottom Info Overlay */}
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

      {/* Content Section */}
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

          {/* Enrollment Info */}
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

          {/* Display enrolled users */}
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

      {/* Hover Accent Border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500 rounded-2xl transition-all duration-300 pointer-events-none"></div>
    </article>
  );
});

// Memoized Event Marker Component
const EventMarker = React.memo(({ event, icon, currentUser, onEnroll, onUnenroll, isEnrolling }) => {
  const isEnrolled = currentUser && event.enrolledUsers && 
    event.enrolledUsers.some(user => user.userId === currentUser.uid);
  
  const enrolledCount = event.enrolledUsers ? event.enrolledUsers.length : 0;

  // Safe function to get host display name
  const getHostDisplayName = (email) => {
    if (!email) return 'Unknown';
    return email.split('@')[0];
  };

  // Check if user can enroll
  const canEnroll = currentUser?.emailVerified;

  return (
    <Marker position={[event.coords.lat, event.coords.lng]} icon={icon}>
      <Popup>
        <div className="max-w-xs">
          <h3 className="font-semibold text-gray-800 mb-1">{event.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
          <div className="text-xs text-gray-500 mb-2">
            {event.datetime?.toDate ? event.datetime.toDate().toLocaleString() : "Date not available"}
          </div>
          <div className="text-xs text-gray-500 mb-3">
            <strong>{enrolledCount}</strong> people enrolled
          </div>
          <div className="mt-2 text-xs text-gray-500">Host: {getHostDisplayName(event.createdby)}</div>
          
          {currentUser && event.createdby !== currentUser.email && (
            <>
              {canEnroll ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEnrolled) {
                      onUnenroll(event.id);
                    } else {
                      onEnroll(event.id);
                    }
                  }}
                  disabled={isEnrolling[event.id]}
                  className={`w-full mt-2 px-3 py-1 rounded text-xs font-medium transition-all ${
                    isEnrolled 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  } disabled:opacity-50`}
                >
                  {isEnrolling[event.id] ? '...' : isEnrolled ? 'Unenroll' : 'Enroll'}
                </button>
              ) : (
                <div className="w-full mt-2 px-3 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700 text-center">
                  Verify email to enroll
                </div>
              )}
            </>
          )}
          
          {currentUser && event.createdby === currentUser.email && (
            <div className="w-full mt-2 px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-700 text-center">
              Your Event
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

// Memoized Selected Location Marker
const SelectedMarker = React.memo(({ location, icon }) => (
  <Marker position={[location.lat, location.lng]} icon={icon}>
    <Popup>
      <div className="text-center">
        <div className="text-lg">📍</div>
        <div className="font-semibold text-red-600">New Event Location</div>
      </div>
    </Popup>
  </Marker>
));

const MapClickHandler = React.memo(({ onMapClick }) => {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  });
  return null;
});

export default function Events() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ name: "", description: "", datetime: "", lat: "", lng: "" });
  const [selectedLocation, setSelectedLocation] = useState(null);
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

  const handleMapClick = React.useCallback((latlng) => {
    setSelectedLocation(latlng);
    setNewEvent(prev => ({ 
      ...prev, 
      lat: latlng.lat.toFixed(6), 
      lng: latlng.lng.toFixed(6) 
    }));
  }, []);

  const clearLocation = React.useCallback(() => {
    setSelectedLocation(null);
    setNewEvent(prev => ({ ...prev, lat: "", lng: "" }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check verification before allowing event creation
    if (!checkUserVerification()) {
      return;
    }
    
    if (!currentUser) return alert("Please sign in to create an event.");
    if (!newEvent.lat || !newEvent.lng) return alert("Select a location on the map.");
    const eventDate = new Date(newEvent.datetime);
    if (eventDate <= new Date()) return alert("Please choose a future date/time.");
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "events"), {
        name: newEvent.name,
        description: newEvent.description,
        datetime: Timestamp.fromDate(eventDate),
        coords: { lat: parseFloat(newEvent.lat), lng: parseFloat(newEvent.lng) },
        createdby: currentUser.email,
        createdAt: serverTimestamp(),
        enrolledUsers: [], // Initialize empty enrolled users array
      });
      setNewEvent({ name: "", description: "", datetime: "", lat: "", lng: "" });
      setSelectedLocation(null);
      alert("Event created!");
    } catch (err) {
      console.error(err);
      alert("Error creating event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced enrollment function with user verification - FIXED
  const handleEnroll = async (eventId) => {
    if (!currentUser) {
      alert("Please sign in to enroll in events.");
      return;
    }

    // Check email verification
    if (!currentUser.emailVerified) {
      alert("Please verify your email address before enrolling in events.");
      return;
    }

    // Check if user is already enrolled
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

    // Check if user is trying to enroll in their own event
    if (event && event.createdby === currentUser.email) {
      alert("You're the host of this event!");
      return;
    }

    // Check enrollment limits (optional - set your own limit)
    if (event && event.enrolledUsers && event.enrolledUsers.length >= 100) {
      alert("This event is full!");
      return;
    }

    setIsEnrolling(prev => ({ ...prev, [eventId]: true }));

    try {
      const eventRef = doc(db, "events", eventId);
      
      // Create enrollment object WITHOUT serverTimestamp() - FIXED
      const enrollmentData = {
        userId: currentUser.uid,
        email: currentUser.email,
        enrolledAt: new Date(), // Use client timestamp instead of serverTimestamp()
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

  // Enhanced unenroll function with user verification - FIXED
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
      
      // Find the user's enrollment object to remove
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
      {/* Verification Banner */}
      <VerificationBanner currentUser={currentUser} onVerifyEmail={handleVerifyEmail} />

      {/* Verification Alert Modal */}
      {showVerificationAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

        {/* Events cards - displayed at top */}
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-3">Create New Event</h2>
              <p className="text-sm text-gray-500 mb-4">Click on the map to set the location, then fill the form and publish.</p>

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

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Location</label>
                  {selectedLocation ? (
                    <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-700">Location selected</div>
                      <div className="text-xs text-gray-600">Lat: {newEvent.lat} • Lng: {newEvent.lng}</div>
                      <button 
                        type="button" 
                        onClick={clearLocation} 
                        className="mt-2 px-3 py-1 rounded-md bg-white border text-sm"
                        disabled={!currentUser?.emailVerified}
                      >
                        Choose different
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm italic text-gray-400">
                      {currentUser?.emailVerified 
                        ? "Click the map to pick a location" 
                        : "Verify email to select location"
                      }
                    </div>
                  )}
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
                    onClick={() => { setNewEvent({ name: "", description: "", datetime: "", lat: "", lng: "" }); setSelectedLocation(null);} } 
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

        {/* Right: Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <span className="text-2xl">🗺️</span>
                <div>
                  <h2 className="text-xl font-semibold">Interactive Map</h2>
                  <p className="text-blue-100 text-sm">Click to set event location • Showing <strong>{events.length}</strong> markers</p>
                </div>
              </div>
            </div>

            <div style={{ height: 520, position: 'relative', zIndex: 1 }}>
              <MapContainer 
                center={[12.9716, 77.5946]} 
                zoom={12} 
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                zoomControl={true}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                <MapClickHandler onMapClick={handleMapClick} />

                {events.map((ev) => (
                  <EventMarker 
                    key={ev.id} 
                    event={ev} 
                    icon={eventIcon}
                    currentUser={currentUser}
                    onEnroll={handleEnroll}
                    onUnenroll={handleUnenroll}
                    isEnrolling={isEnrolling}
                  />
                ))}

                {selectedLocation && (
                  <SelectedMarker location={selectedLocation} icon={newEventIcon} />
                )}
              </MapContainer>
            </div>                         
          </div> 
        </div>                             
      </div>
    </div>
  );
}