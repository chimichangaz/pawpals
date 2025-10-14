import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PetsService } from '../services/pets.service';
import PetCard from '../components/pets/PetCard';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';

export default function BrowsePets() {
  const { currentUser } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ type: '', search: '' });
  const [imageUrls, setImageUrls] = useState({});

  const storage = getStorage();

  useEffect(() => {
    loadPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function resolveImageUrls(list) {
    const map = {};
    await Promise.all(
      (list || []).map(async (p) => {
        try {
          if (!p || !p.photo) return;
          const src = p.photo;
          if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
            map[p.id] = src;
            return;
          }
          let path = src;
          if (path.startsWith('gs://')) {
            const withoutGs = path.replace('gs://', '');
            const parts = withoutGs.split('/');
            parts.shift();
            path = parts.join('/');
          }
          const ref = storageRef(storage, path);
          const url = await getDownloadURL(ref);
          map[p.id] = url;
        } catch (err) {
          // ignore per-image errors
          // console.warn('image load failed for pet', p.id, err);
        }
      })
    );
    setImageUrls(map);
  }

  async function loadPets() {
    try {
      setLoading(true);
      setError('');
      const allPets = await PetsService.getAllPets();
      const otherUsersPets = currentUser
        ? (allPets || []).filter((pet) => pet.ownerId !== currentUser.uid)
        : (allPets || []);
      setPets(otherUsersPets);
      resolveImageUrls(otherUsersPets);
    } catch (err) {
      console.error('Error loading pets:', err);
      setError('Unable to load pets. Please try again later.');
      setPets([]);
    } finally {
      setLoading(false);
    }
  }

  const normalizedFilter = (v) => (v || '').toString().trim().toLowerCase();

  const filteredPets = pets.filter((pet) => {
    const typeMatch = !filters.type || (pet.type || '').toString().toLowerCase() === filters.type.toLowerCase();
    const q = normalizedFilter(filters.search);
    const searchMatch = !q || [pet.name, pet.breed, pet.bio]
      .filter(Boolean)
      .some((field) => field.toString().toLowerCase().includes(q));
    return typeMatch && searchMatch;
  });

  return (
    <>
      <style>{`
        .pet-card { background-color: #ffffff !important; }
        .pet-name { color: #000000 !important; font-weight: 900 !important; }
        .pet-info { background-color: #ffffff !important; }
        .pet-details { color: #1f2937 !important; }
        .pet-breed { color: #1f2937 !important; }
        .pet-meta { color: #1f2937 !important; }
        .pet-bio { color: #374151 !important; }
      `}</style>
      <div className="min-h-screen py-12 bg-gradient-to-br from-gray-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden">

            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Browse Pets</h1>
                <p className="mt-2 text-sm text-gray-600">Discover pets in your community — connect, adopt, or follow their journey.</p>
              </div>

              <div className="w-full md:w-auto flex items-center gap-3">
                <div className="bg-gray-50 border border-gray-300 rounded-full px-3 py-2 shadow-sm flex items-center gap-2">
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="bg-transparent outline-none text-sm text-gray-800 font-medium"
                    aria-label="Filter by pet type"
                  >
                    <option value="">All types</option>
                    <option value="dog">Dogs</option>
                    <option value="cat">Cats</option>
                    <option value="bird">Birds</option>
                    <option value="rabbit">Rabbits</option>
                    <option value="hamster">Hamsters</option>
                    <option value="fish">Fish</option>
                    <option value="reptile">Reptiles</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search by name, breed or description..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-emerald-200 text-gray-900"
                    aria-label="Search pets"
                  />
                </div>

                <button
                  onClick={loadPets}
                  className="ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow hover:scale-[1.02] transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-700 font-medium">{filteredPets.length} pet{filteredPets.length !== 1 ? 's' : ''} found</div>
                {currentUser && <div className="text-xs text-gray-500">(your pets are hidden from this view)</div>}
              </div>

              {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3,4,5,6].map((n) => (
                    <div key={n} className="h-56 rounded-2xl bg-gray-200 animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {filteredPets.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 text-3xl">🔍</div>
                      <h3 className="mt-6 text-xl font-semibold text-gray-800">No pets found</h3>
                      <p className="mt-2 text-gray-600">Try different filters or search terms, or check back later.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPets.map((pet) => (
                        <div key={pet.id} className="transform hover:scale-[1.01] transition">
                          <PetCard pet={{ ...pet, photo: imageUrls[pet.id] || pet.photo }} showActions={false} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}