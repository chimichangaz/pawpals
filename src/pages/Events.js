// src/pages/Events.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles/base.css";
import "../styles/pets.css";
import "../styles/forum.css";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function LocationSelector({ setCoords }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setCoords([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function Events() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name: "", datetime: "", coords: null });

  // Remove past events automatically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setEvents((prev) =>
        prev.filter((event) => new Date(event.datetime) > now)
      );
    }, 60 * 1000); // every minute
    return () => clearInterval(interval);
  }, []);

  const addEvent = (e) => {
    e.preventDefault();
    if (!form.name || !form.datetime || !form.coords) return;
    setEvents([...events, form]);
    setForm({ name: "", datetime: "", coords: null });
  };

  return (
    <div className="events-page">
      <h2>Pet Events & Meetups</h2>
      {!currentUser && <p>Please log in to create events.</p>}

      {currentUser && (
        <div className="event-form">
          <h3>Create New Event</h3>
          <form onSubmit={addEvent}>
            <input
              type="text"
              placeholder="Event Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
            <input
              type="datetime-local"
              value={form.datetime}
              onChange={(e) =>
                setForm({ ...form, datetime: e.target.value })
              }
            />
            <MapContainer
              center={[12.9716, 77.5946]} // Bangalore
              zoom={13}
              style={{ height: "300px", margin: "1rem 0" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <LocationSelector
                setCoords={(coords) => setForm({ ...form, coords })}
              />
            </MapContainer>
            <button type="submit" className="btn btn-primary">
              Add Event
            </button>
          </form>
        </div>
      )}

      <div className="events-map">
        <h3>Upcoming Events</h3>
        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={13}
          style={{ height: "400px", marginBottom: "2rem" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {events.map((event, idx) => (
            <Marker key={idx} position={event.coords}>
              <Popup>
                <strong>{event.name}</strong>
                <br />
                {new Date(event.datetime).toLocaleString()}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default Events;
