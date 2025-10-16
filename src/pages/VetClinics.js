import React, { useState } from "react";

const clinics = [
  {
    id: 1,
    name: "Cessna Lifeline Veterinary Hospital - Domlur",
    address: "148, Amarjyoti Layout, KGA Rd, Domlur, Bengaluru 560071",
    phone: "+91-8041414141",
    lat: 12.95646,
    lng: 77.642535,
    mapLink: "https://maps.google.com/?q=12.95646,77.642535",
  },
  {
    id: 2,
    name: "Precise Pet Clinic",
    address: "485 & 486, 8th Cross, Jeevan Bheema Nagar Main Road, HAL 3rd Stage, Bangalore 560075",
    phone: "+91-8066363636",
    lat: 12.9685557,
    lng: 77.651507,
    mapLink: "https://maps.google.com/?q=12.9685557,77.651507",
  },
  {
    id: 3,
    name: "Cessna Lifeline Veterinary Hospital - Hosur Main Road",
    address: "Hosur Main Road, Bengaluru",
    phone: "+91-8026262626",
    lat: 12.8732996,
    lng: 77.6511576,
    mapLink: "https://maps.google.com/?q=12.8732996,77.6511576",
  },
];

export default function VetClinics() {
  const [selectedClinic, setSelectedClinic] = useState(clinics[0]);

  // Google Maps Embed URL
  const getMapUrl = () => {
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${selectedClinic.lat},${selectedClinic.lng}&zoom=14`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white py-8">
      <div className="pt-16"></div>
      
      <div className="max-w-7xl mx-auto px-4">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-4 justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-300 flex items-center justify-center text-white text-2xl shadow-lg">
              🏥
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Vet Clinics in Bangalore
              </h1>
              <p className="mt-2 text-gray-600">
                Find trusted veterinary clinics and emergency facilities near you
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section - Made taller */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-white">
              <div style={{ height: '700px', position: 'relative' }}> {/* Increased from 520px to 700px */}
                <iframe
                  src={getMapUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Bangalore Veterinary Clinics Map"
                  className="rounded-2xl"
                />
                
                {/* Overlay with clinic information */}
                {selectedClinic && (
                  <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs border">
                    <h3 className="font-semibold text-gray-800 text-sm mb-2">
                      {selectedClinic.name}
                    </h3>
                    <p className="text-gray-600 text-xs mb-3">
                      {selectedClinic.address}
                    </p>
                    <div className="space-y-2">
                      <a 
                        href={selectedClinic.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-blue-500 text-white py-2 px-3 rounded text-center text-xs hover:bg-blue-600 transition-colors"
                      >
                        Get Directions
                      </a>
                      {selectedClinic.phone && (
                        <a 
                          href={`tel:${selectedClinic.phone}`}
                          className="block w-full bg-green-500 text-white py-2 px-3 rounded text-center text-xs hover:bg-green-600 transition-colors"
                        >
                          Call Clinic
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Map Legend - Moved inside the map column to extend the map area */}
            <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Map Legend</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clinics.map((clinic, index) => (
                  <div key={clinic.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">{clinic.name}</div>
                      <div className="text-gray-600 text-xs line-clamp-2">{clinic.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clinics List */}
          <aside className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Clinics</h3>
                
                <div className="space-y-4">
                  {clinics.map(clinic => (
                    <div 
                      key={clinic.id} 
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedClinic?.id === clinic.id 
                          ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:shadow-md'
                      }`}
                      onClick={() => setSelectedClinic(clinic)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                            {clinic.id}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                              {clinic.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {clinic.address}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-emerald-600 whitespace-nowrap flex-shrink-0 ml-2">⭐ Trusted</div>
                      </div>
                      
                      {/* Fixed aligned buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <a 
                          href={clinic.mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 text-white py-2 px-3 rounded text-center text-sm hover:bg-emerald-700 transition-colors truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Directions
                        </a>
                        {clinic.phone ? (
                          <a 
                            href={`tel:${clinic.phone}`}
                            className="border border-emerald-600 text-emerald-600 py-2 px-3 rounded text-center text-sm hover:bg-emerald-50 transition-colors truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Call
                          </a>
                        ) : (
                          <div className="border border-gray-300 text-gray-400 py-2 px-3 rounded text-center text-sm cursor-not-allowed">
                            No Phone
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Section */}
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6">
                <h4 className="text-lg font-semibold text-rose-800 mb-3">
                  🚨 Emergency Care
                </h4>
                <p className="text-rose-700 text-sm mb-4">
                  If this is an emergency, call immediately or go to the nearest animal hospital.
                </p>
                <div className="space-y-2">
                  <a 
                    href="tel:112"
                    className="block w-full bg-rose-500 text-white py-3 px-4 rounded text-center font-semibold hover:bg-rose-600 transition-colors"
                  >
                    Emergency Helpline
                  </a>
                  <a 
                    href="https://maps.google.com/search/emergency+veterinary+hospital+bangalore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full border border-rose-500 text-rose-500 py-3 px-4 rounded text-center font-semibold hover:bg-rose-100 transition-colors"
                  >
                    Find Emergency Clinic
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}