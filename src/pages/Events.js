// src/pages/Events.js
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

// Custom map pin
const eventIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom icon for new event location (red marker)
const newEventIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function Events() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    datetime: "",
    lat: "",
    lng: "",
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch events in real-time
  useEffect(() => {
    const now = Timestamp.now();
    const q = query(collection(db, "events"), where("datetime", ">", now));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, []);

  // Handle map click
  const handleMapClick = (latlng) => {
    setSelectedLocation(latlng);
    setNewEvent({
      ...newEvent,
      lat: latlng.lat.toFixed(6),
      lng: latlng.lng.toFixed(6),
    });
  };

  // Clear selected location
  const clearLocation = () => {
    setSelectedLocation(null);
    setNewEvent({
      ...newEvent,
      lat: "",
      lng: "",
    });
  };

  // Add new event
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please sign in to create an event.");
      return;
    }

    if (!newEvent.lat || !newEvent.lng) {
      alert("Please click on the map to select a location for your event.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "events"), {
        name: newEvent.name,
        description: newEvent.description,
        datetime: Timestamp.fromDate(new Date(newEvent.datetime)),
        coords: {
          lat: parseFloat(newEvent.lat),
          lng: parseFloat(newEvent.lng),
        },
        createdby: currentUser.email,
        createdAt: serverTimestamp(),
      });

      setNewEvent({ name: "", description: "", datetime: "", lat: "", lng: "" });
      setSelectedLocation(null);
      alert("Event created successfully!");
    } catch (error) {
      console.error("Error adding event: ", error);
      alert("Error creating event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-4xl">🐾</span>
            Community Events
          </h1>
          <p className="text-gray-600 mt-2">Create and discover pet-friendly events in your area</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Event Creation Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✨</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Create New Event</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Event Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dog Park Meetup"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Tell us about your event..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    required
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-none"
                  />
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.datetime}
                    onChange={(e) => setNewEvent({ ...newEvent, datetime: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Location Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📍</span>
                    <h3 className="font-medium text-gray-800">Event Location</h3>
                  </div>
                  
                  {selectedLocation ? (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <span className="text-lg">✅</span>
                          <span className="font-medium">Location Selected</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>Latitude: {newEvent.lat}</div>
                          <div>Longitude: {newEvent.lng}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearLocation}
                        className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200 text-sm font-medium"
                      >
                        🔄 Choose Different Location
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-orange-600 mb-2">
                        <span className="text-2xl">🗺️</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Click on the map to select your event location
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedLocation}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                    isSubmitting || !selectedLocation
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Event...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-lg">🎉</span>
                      Create Event
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  <span className="text-2xl">🗺️</span>
                  <div>
                    <h2 className="text-xl font-semibold">Interactive Map</h2>
                    <p className="text-blue-100 text-sm">Click anywhere to set your event location</p>
                  </div>
                </div>
              </div>

              <div className="relative">
                {/* Map */}
                <div style={{ height: "600px" }} className="w-full">
                  <MapContainer
                    center={[12.9716, 77.5946]} // Default to Bangalore
                    zoom={12}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Handle map clicks */}
                    <MapClickHandler onMapClick={handleMapClick} />
                    
                    {/* Show existing events */}
                    {events.map((event) => (
                      <Marker
                        key={event.id}
                        position={[event.coords.lat, event.coords.lng]}
                        icon={eventIcon}
                      >
                        <Popup className="custom-popup">
                          <div className="p-2">
                            <h3 className="font-semibold text-gray-800 mb-2">{event.name}</h3>
                            <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div className="flex items-center gap-1">
                                <span>📅</span>
                                {event.datetime?.toDate
                                  ? event.datetime.toDate().toLocaleString()
                                  : ""}
                              </div>
                              <div className="flex items-center gap-1">
                                <span>👤</span>
                                {event.createdby}
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    
                    {/* Show selected location for new event */}
                    {selectedLocation && (
                      <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={newEventIcon}>
                        <Popup>
                          <div className="p-2 text-center">
                            <div className="text-lg mb-2">📍</div>
                            <h3 className="font-semibold text-red-600 mb-1">New Event Location</h3>
                            <div className="text-xs text-gray-500">
                              <div>Lat: {selectedLocation.lat.toFixed(6)}</div>
                              <div>Lng: {selectedLocation.lng.toFixed(6)}</div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>

                {/* Map Instructions Overlay */}
                {!selectedLocation && (
                  <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        💡
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">Click anywhere on the map to select your event location</p>
                        <p className="text-xs text-gray-600">The selected location will appear as a red marker</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Events Counter */}
            <div className="mt-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Event Statistics</h3>
                    <p className="text-sm text-gray-600">Upcoming events in your area</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{events.length}</div>
                  <div className="text-xs text-gray-500">Active Events</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Events;