// src/pages/VetClinics.js
import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const clinics = [
  {
    id: 1,
    name: "Cessna Lifeline Veterinary Hospital - Domlur",
    address: "148, Amarjyoti Layout, KGA Rd, Domlur, Bengaluru 560071",
    lat: 12.95646,
    lng: 77.642535,
    mapLink: "https://www.google.com/maps/place/Cessna+Lifeline+Veterinary+Hospital,+Domlur/@12.9564652,77.6399601,17z/data=!3m1!4b1!4m6!3m5!1s0x3bae16b02658fb3f:0x32d69ed796d7b024!8m2!3d12.95646!4d77.642535!16s%2Fg%2F1vb9bhqh?entry=ttu"
  },
  {
    id: 2,
    name: "Precise Pet Clinic",
    address: "485 & 486, 8th Cross, Jeevan Bheema Nagar Main Road, HAL 3rd Stage, Bangalore 560075",
    lat: 12.9685557,
    lng: 77.651507,
    mapLink: "https://www.google.com/maps/place/Precise+Pet+Clinic/@12.9685609,77.6489321,17z/data=!3m1!4b1!4m6!3m5!1s0x3bae140047fdddff:0x88194df4e78ef29e!8m2!3d12.9685557!4d77.651507!16s%2Fg%2F1tggm2dp?entry=ttu"
  },
  {
    id: 3,
    name: "Cessna Lifeline Veterinary Hospital - Hosur Main Road",
    address: "Hosur Main Road, Bengaluru",
    lat: 12.8732996,
    lng: 77.6511576,
    mapLink: "https://www.google.com/maps/place/Cessna+Lifeline+Veterinary+Hospital+Hosur+Main+Road/@12.9702387,77.5691043,12z/data=!4m10!1m2!2m1!1scessna+lifeline+!3m6!1s0x3bae14b1dfcb7013:0x50d776d0314cd672!8m2!3d12.8732996!4d77.6511576!15sCg9jZXNzbmEgbGlmZWxpbmVaESIPY2Vzc25hIGxpZmVsaW5lkgEMdmV0ZXJpbmFyaWFuqgFECgsvZy8xdmI5YmhxaBABMh4QASIat7eRoaVNkqe3nSsvS20FPvwQ9O-lTG3JUCgyExACIg9jZXNzbmEgbGlmZWxpbmXgAQA!16s%2Fg%2F11c61kknj1?entry=ttu"
  }
];



function VetClinics() {
  return (
    <div className="page-container">
      <h1 className="page-title">🐶 Vet Clinics in South Bangalore</h1>
      <p>Find trusted veterinary clinics near you.</p>

      <MapContainer
        center={[12.9165, 77.6101]}
        zoom={13}
        style={{ height: "500px", width: "100%", borderRadius: "12px", marginTop: "1rem" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        />
        {clinics.map((clinic) => (
          <Marker key={clinic.id} position={[clinic.lat, clinic.lng]}>
            <Popup className="custom-popup">
  <div className="p-2">
    <h3 className="font-semibold text-blue-600 mb-2">
      <a 
        href={clinic.mapLink} 
        target="_blank" 
        rel="noopener noreferrer"
        className="hover:underline"
      >
        {clinic.name}
      </a>
    </h3>
    <p className="text-gray-600 text-sm">{clinic.address}</p>
  </div>
</Popup>

          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default VetClinics;
