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
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

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

// Memoized Event Card Component
const EventCard = React.memo(({ ev, idx }) => {
  const eventImages = [
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop&q=80'
  ];
  const imageUrl = ev.image || eventImages[idx % eventImages.length];
  
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
              {ev.coords?.lat.toFixed(2)}, {ev.coords?.lng.toFixed(2)}
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
          
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {ev.createdby ? ev.createdby[0].toUpperCase() : 'U'}
              </div>
              <div className="text-xs text-gray-500">
                Host: <span className="font-medium text-gray-700">{ev.createdby?.split('@')[0]}</span>
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
const EventMarker = React.memo(({ event, icon }) => (
  <Marker position={[event.coords.lat, event.coords.lng]} icon={icon}>
    <Popup>
      <div className="max-w-xs">
        <h3 className="font-semibold text-gray-800 mb-1">{event.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
        <div className="text-xs text-gray-500">{event.datetime?.toDate ? event.datetime.toDate().toLocaleString() : "Date not available"}</div>
        <div className="mt-2 text-xs text-gray-500">Host: {event.createdby}</div>
      </div>
    </Popup>
  </Marker>
));

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
  const [cleanupStats, setCleanupStats] = useState({ cleaned: 0, lastCleanup: null });

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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
              {events.map((ev, idx) => {
                const eventImages = [
                  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop&q=80'
                ];
                const imageUrl = ev.image || eventImages[idx % eventImages.length];
                
                return (
                  <article 
                    key={ev.id} 
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
                            {ev.coords?.lat.toFixed(2)}, {ev.coords?.lng.toFixed(2)}
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
                        
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {ev.createdby ? ev.createdby[0].toUpperCase() : 'U'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Host: <span className="font-medium text-gray-700">{ev.createdby?.split('@')[0]}</span>
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
              })}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    required
                    placeholder="Dog Park Meetup"
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
                  />
                  <small className="text-xs text-gray-500">Must be a future date</small>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Location</label>
                  {selectedLocation ? (
                    <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-700">Location selected</div>
                      <div className="text-xs text-gray-600">Lat: {newEvent.lat} • Lng: {newEvent.lng}</div>
                      <button type="button" onClick={clearLocation} className="mt-2 px-3 py-1 rounded-md bg-white border text-sm">Choose different</button>
                    </div>
                  ) : (
                    <div className="text-sm italic text-gray-400">Click the map to pick a location</div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button disabled={isSubmitting} type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 font-semibold shadow disabled:opacity-50">
                    {isSubmitting ? "Creating..." : "Create Event"}
                  </button>
                  <button type="button" onClick={() => { setNewEvent({ name: "", description: "", datetime: "", lat: "", lng: "" }); setSelectedLocation(null);} } className="rounded-xl bg-white border px-4 py-2">Cancel</button>
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
                  <EventMarker key={ev.id} event={ev} icon={eventIcon} />
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