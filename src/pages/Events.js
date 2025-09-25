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
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  writeBatch
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
  const [cleanupStats, setCleanupStats] = useState({ cleaned: 0, lastCleanup: null });

  // Function to clean up past events
  const cleanupPastEvents = async () => {
    try {
      console.log("Starting cleanup of past events...");
      
      // Get current time minus 1 hour buffer (to avoid deleting events that just ended)
      const bufferTime = new Date();
      bufferTime.setHours(bufferTime.getHours() - 1);
      const cutoffTime = Timestamp.fromDate(bufferTime);

      // Query for events that are past the cutoff time
      const pastEventsQuery = query(
        collection(db, "events"),
        where("datetime", "<", cutoffTime),
        orderBy("datetime")
      );

      const pastEventsSnapshot = await getDocs(pastEventsQuery);
      
      if (pastEventsSnapshot.empty) {
        console.log("No past events to clean up");
        return 0;
      }

      // Use batch to delete multiple documents efficiently
      const batch = writeBatch(db);
      let deleteCount = 0;

      pastEventsSnapshot.forEach((docSnapshot) => {
        batch.delete(doc(db, "events", docSnapshot.id));
        deleteCount++;
        console.log(`Scheduled for deletion: ${docSnapshot.data().name} - ${docSnapshot.data().datetime.toDate()}`);
      });

      // Execute the batch delete
      await batch.commit();
      
      console.log(`Successfully deleted ${deleteCount} past events`);
      
      // Update cleanup stats
      setCleanupStats({
        cleaned: deleteCount,
        lastCleanup: new Date().toLocaleString()
      });

      return deleteCount;

    } catch (error) {
      console.error("Error during cleanup:", error);
      return 0;
    }
  };

  // Fetch events in real-time (only future events)
  useEffect(() => {
    // First, run cleanup when component mounts
    cleanupPastEvents();

    // Then set up real-time listener for future events
    const now = Timestamp.now();
    const q = query(
      collection(db, "events"), 
      where("datetime", ">", now),
      orderBy("datetime", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log(`Loaded ${eventsData.length} upcoming events`);
      setEvents(eventsData);
    });

    // Set up periodic cleanup (every 30 minutes)
    const cleanupInterval = setInterval(() => {
      cleanupPastEvents();
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
    };
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

    // Validate that the event is in the future
    const eventDate = new Date(newEvent.datetime);
    const now = new Date();
    
    if (eventDate <= now) {
      alert("Please select a future date and time for your event.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "events"), {
        name: newEvent.name,
        description: newEvent.description,
        datetime: Timestamp.fromDate(eventDate),
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

  // Manual cleanup trigger (for admin/testing)
  const handleManualCleanup = async () => {
    const deletedCount = await cleanupPastEvents();
    alert(`Cleanup completed! Deleted ${deletedCount} past events.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header - Centered */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <span className="text-5xl">🐾</span>
              Community Events
            </h1>
            <p className="text-gray-600 mt-3 text-lg max-w-2xl mx-auto">
              Create and discover pet-friendly events in your area
            </p>
            
            {/* Cleanup Stats & Manual Trigger - Centered below motto */}
            <div className="mt-4 flex flex-col items-center space-y-2">
              {cleanupStats.lastCleanup && (
                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                  <span className="font-medium">Last cleanup:</span> {cleanupStats.lastCleanup} • 
                  <span className="font-medium ml-2">Events cleaned:</span> {cleanupStats.cleaned}
                </div>
              )}
              <button
                onClick={handleManualCleanup}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 text-sm font-medium"
              >
                <span className="text-base">🗑️</span>
                Manual Cleanup
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Event Creation Form - Premium Layout */}
          <div className="lg:col-span-1">
            <div className="form-container">
              {/* Left image panel */}
              <div className="form-image"></div>

              {/* Right form panel */}
              <div className="form-content">
                <h2>Create New Event</h2>
                <form onSubmit={handleSubmit}>
                  {/* Event Name */}
                  <div className="form-group">
                    <label>Event Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Dog Park Meetup"
                      value={newEvent.name}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      placeholder="Tell us about your event..."
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, description: e.target.value })
                      }
                      required
                      rows="3"
                    ></textarea>
                  </div>

                  {/* Date & Time */}
                  <div className="form-group">
                    <label>Date & Time</label>
                    <input
                      type="datetime-local"
                      value={newEvent.datetime}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, datetime: e.target.value })
                      }
                      min={new Date().toISOString().slice(0, 16)} // Prevent past dates
                      required
                    />
                    <small className="text-gray-500 text-xs">
                      Event must be scheduled for future date/time
                    </small>
                  </div>

                  {/* Location Section */}
                  <div className="form-group">
                    <label>Event Location</label>
                    {selectedLocation ? (
                      <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-3">
                        <div>✅ Location Selected</div>
                        <div className="text-sm">
                          Latitude: {newEvent.lat} <br />
                          Longitude: {newEvent.lng}
                        </div>
                        <button
                          type="button"
                          onClick={clearLocation}
                          className="btn btn-secondary mt-2"
                        >
                          🔄 Choose Different Location
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        Click on the map to select a location
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setNewEvent({
                          name: "",
                          description: "",
                          datetime: "",
                          lat: "",
                          lng: "",
                        });
                        setSelectedLocation(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting || !selectedLocation}
                    >
                      {isSubmitting ? "Creating..." : "Create Event"}
                    </button>
                  </div>
                </form>
              </div>
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
                    <p className="text-blue-100 text-sm">
                      Click anywhere to set your event location • Showing {events.length} upcoming events
                    </p>
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
                            <h3 className="font-semibold text-gray-800 mb-2">
                              {event.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {event.description}
                            </p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div className="flex items-center gap-1">
                                <span>📅</span>
                                {event.datetime?.toDate
                                  ? event.datetime.toDate().toLocaleString()
                                  : "Date not available"}
                              </div>
                              <div className="flex items-center gap-1">
                                <span>👤</span>
                                {event.createdby}
                              </div>
                              <div className="flex items-center gap-1">
                                <span>⏰</span>
                                <span className="text-green-600 font-medium">Upcoming</span>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Show selected location for new event */}
                    {selectedLocation && (
                      <Marker
                        position={[
                          selectedLocation.lat,
                          selectedLocation.lng,
                        ]}
                        icon={newEventIcon}
                      >
                        <Popup>
                          <div className="p-2 text-center">
                            <div className="text-lg mb-2">📍</div>
                            <h3 className="font-semibold text-red-600 mb-1">
                              New Event Location
                            </h3>
                            <div className="text-xs text-gray-500">
                              <div>
                                Lat: {selectedLocation.lat.toFixed(6)}
                              </div>
                              <div>
                                Lng: {selectedLocation.lng.toFixed(6)}
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>

                {/* Map Instructions Overlay */}
                {!selectedLocation && (
                  <div className="absolute top-4 left-4 right-4 map-instructions slide-in-left">
                    <h3 className="premium-heading">💡 How to Select Location</h3>
                    <p>Click anywhere on the map to select your event location.</p>
                    <p>
                      The selected location will appear as a <strong>red marker</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Events Counter with Cleanup Info */}
            <div className="stats-card slide-in-right">
              <div className="flex items-center gap-3">
                <div className="stats-icon">📊</div>
                <div>
                  <h3 className="premium-heading">Event Statistics</h3>
                  <p>Upcoming events • Auto-cleanup enabled</p>
                </div>
              </div>
              <div className="text-right">
                <div className="premium-number">{events.length}</div>
                <div className="text-xs text-gray-400">Active Events</div>
                <div className="text-xs text-green-600 mt-1">
                  🗑️ Past events auto-deleted
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