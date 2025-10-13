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
    mapLink:
      "https://www.google.com/maps/place/Cessna+Lifeline+Veterinary+Hospital,+Domlur/@12.9564652,77.6399601,17z/data=!3m1!4b1!4m6!3m5!1s0x3bae16b02658fb3f:0x32d69ed796d7b024!8m2!3d12.95646!4d77.642535!16s%2Fg%2F1vb9bhqh?entry=ttu",
  },
  {
    id: 2,
    name: "Precise Pet Clinic",
    address:
      "485 & 486, 8th Cross, Jeevan Bheema Nagar Main Road, HAL 3rd Stage, Bangalore 560075",
    lat: 12.9685557,
    lng: 77.651507,
    mapLink:
      "https://www.google.com/maps/place/Precise+Pet+Clinic/@12.9685609,77.6489321,17z/data=!3m1!4b1!4m6!3m5!1s0x3bae140047fdddff:0x88194df4e78ef29e!8m2!3d12.9685557!4d77.651507!16s%2Fg%2F1tggm2dp?entry=ttu",
  },
  {
    id: 3,
    name: "Cessna Lifeline Veterinary Hospital - Hosur Main Road",
    address: "Hosur Main Road, Bengaluru",
    lat: 12.8732996,
    lng: 77.6511576,
    mapLink:
      "https://www.google.com/maps/place/Cessna+Lifeline+Veterinary+Hospital+Hosur+Main+Road/@12.9702387,77.5691043,12z/data=!4m10!1m2!2m1!1scessna+lifeline+!3m6!1s0x3bae14b1dfcb7013:0x50d776d0314cd672!8m2!3d12.8732996!4d77.6511576!15sCg9jZXNzbmEgbGlmZWxpbmVaESIPY2Vzc25hIGxpZmVsaW5lkgEMdmV0ZXJpbmFyaWFuqgFECgsvZy8xdmI5YmhxaBABMh4QASIat7eRoaVNkqe3nSsvS20FPvwQ9O-lTG3JUCgyExACIg9jZXNzbmEgbGlmZWxpbmXgAQA!16s%2Fg%2F11c61kknj1?entry=ttu",
  },
];

const clinicIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function VetClinics() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-4 justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-300 flex items-center justify-center text-white text-2xl shadow-lg">🏥</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Vet Clinics in South Bangalore</h1>
              <p className="mt-2 text-gray-600">Trusted veterinary clinics and emergency facilities near you. Click a marker for details or open directions in Google Maps.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-xl bg-white">
              <MapContainer
                center={[12.9165, 77.6101]}
                zoom={12}
                style={{ height: "520px", width: "100%" }}
                className="rounded-2xl"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                />

                {clinics.map((clinic) => (
                  <Marker key={clinic.id} position={[clinic.lat, clinic.lng]} icon={clinicIcon}>
                    <Popup className="text-sm">
                      <div className="p-2">
                        <h3 className="font-semibold text-emerald-600 mb-1">
                          <a href={clinic.mapLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {clinic.name}
                          </a>
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">{clinic.address}</p>
                        <div className="flex items-center gap-2">
                          <a href={`tel:${clinic.phone || ''}`} className="text-sm text-emerald-600 hover:underline">Call</a>
                          <a href={clinic.mapLink} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline">Directions</a>
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(clinic.name + ' ' + clinic.address)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline">Search</a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-gray-100 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Clinic Highlights</h3>
                <p className="text-sm text-gray-600">We surface clinics with experienced vets, emergency care and favourable reviews. Tap a clinic on the map to view details and get directions.</p>

                <div className="mt-3 space-y-3">
                  {clinics.map(c => (
                    <div key={c.id} className="p-3 rounded-lg border bg-white hover:shadow-md">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{c.address}</div>
                        </div>
                        <div className="text-xs text-emerald-600">⭐ Trusted</div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <a href={c.mapLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-md bg-emerald-600 text-white text-sm">Directions</a>
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(c.name + ' ' + c.address)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-md border text-sm">Details</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-gray-100 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800">Need urgent care?</h4>
                <p className="text-sm text-gray-600 mt-2">If this is an emergency, call your nearest clinic or seek immediate transport to an animal hospital.</p>
                <div className="mt-3">
                  <a href="tel:112" className="px-3 py-2 rounded-md bg-rose-500 text-white">Emergency Help</a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
