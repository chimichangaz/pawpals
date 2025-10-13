import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PetsService } from '../services/pets.service';
import AddPetForm from '../components/pets/AddPetForm';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';

export default function MyPets() {
  const { currentUser } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [error, setError] = useState('');

  const [imageUrls, setImageUrls] = useState({});

  const storage = getStorage();

  async function resolveImageUrls(petsList) {
    console.log('🔍 MyPets: Resolving image URLs for', petsList.length, 'pets');
    const map = {};
    await Promise.all(petsList.map(async (p) => {
      try {
        // Support both 'photo' (old) and 'images' array (new)
        const photoSource = p.images?.[0] || p.photo;
        
        if (!p || !photoSource) {
          console.log(`⚠️ Pet ${p?.id} has no photo. Full pet object:`, p);
          return;
        }
        const src = photoSource;
        
        // Handle HTTP/HTTPS URLs
        if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
          console.log(`✅ Pet ${p.id}: Using HTTP(S) URL`);
          map[p.id] = src;
          return;
        }
        
        // Handle base64 strings
        if (typeof src === 'string' && src.startsWith('data:')) {
          console.log(`✅ Pet ${p.id}: Using data URI`);
          map[p.id] = src;
          return;
        }
        
        // Handle raw base64 without data URI prefix
        if (typeof src === 'string' && src.length > 100 && !src.includes('/') && !src.includes('gs://')) {
          console.log(`✅ Pet ${p.id}: Converting raw base64 to data URI`);
          map[p.id] = `data:image/jpeg;base64,${src}`;
          return;
        }
        
        // assume it's a storage path (e.g. 'profiles/abc.jpg' or 'gs://...')
        console.log(`🔗 Pet ${p.id}: Fetching from Firebase Storage:`, src.substring(0, 50));
        let path = src;
        if (path.startsWith('gs://')) {
          const withoutGs = path.replace('gs://', '');
          const parts = withoutGs.split('/');
          parts.shift();
          path = parts.join('/');
        }
        const ref = storageRef(storage, path);
        const url = await getDownloadURL(ref);
        console.log(`✅ Pet ${p.id}: Got storage URL`);
        map[p.id] = url;
      } catch (err) {
        console.error(`❌ Pet ${p?.id}: Image load failed:`, err);
      }
    }));
    console.log('📦 MyPets: Final imageUrls map:', Object.keys(map).length, 'images resolved');
    setImageUrls(map);
  }

  useEffect(() => {
    if (currentUser) loadPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function loadPets() {
    try {
      setLoading(true);
      setError('');
      const userPets = await PetsService.getPetsByOwner(currentUser.uid);
      const list = Array.isArray(userPets) ? userPets : [];
      setPets(list);
      // resolve image URLs for display
      resolveImageUrls(list);
    } catch (err) {
      console.error('Error loading pets:', err);
      setError('Failed to load pets. Please try again later.');
      setPets([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePet(petId) {
    if (!window.confirm('Are you sure you want to delete this pet?')) return;
    try {
      await PetsService.deletePet(petId);
      setPets(prev => prev.filter(p => p.id !== petId));
    } catch (err) {
      console.error('Error deleting pet:', err);
      alert('Failed to delete pet. Please try again.');
    }
  }

  function handleEditPet(pet) {
    setEditingPet(pet);
    setShowAddForm(true);
  }

  function handleFormSuccess() {
    setShowAddForm(false);
    setEditingPet(null);
    loadPets();
  }

  function handleFormCancel() {
    setShowAddForm(false);
    setEditingPet(null);
  }

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-2xl p-8 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border border-white/30 text-center">
          <h3 className="text-xl font-semibold text-gray-800">Please sign in to view your pets</h3>
          <p className="text-gray-600 mt-2">You need to be logged in to manage your pets.</p>
          <a href="/login" className="inline-flex mt-4 px-5 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-medium">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">

          <div className="p-6 flex items-center justify-between border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">My Pets</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your pets, add photos, and keep their profiles up to date.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setEditingPet(null); setShowAddForm(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-semibold shadow hover:scale-[1.02] transition"
              >
                + Add New Pet
              </button>
              <button
                onClick={loadPets}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-sm"
                aria-label="Refresh pets"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded-lg">{error}</div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(s => (
                  <div key={s} className="h-44 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {pets.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 text-emerald-700 text-3xl">🐾</div>
                    <h3 className="mt-6 text-xl font-semibold text-gray-800">No pets yet</h3>
                    <p className="text-gray-600 mt-2">Add your first pet to get started connecting with other pet owners.</p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <button onClick={() => { setEditingPet(null); setShowAddForm(true); }} className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-semibold">Add Your First Pet</button>
                      <a href="/events" className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700">Browse Events</a>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pets.map(pet => (
                      <div key={pet.id} className="rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100 flex flex-col">
                        <div className="relative h-44 w-full bg-gray-100">
                          {imageUrls[pet.id] ? (
                            <img src={imageUrls[pet.id]} alt={pet.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                          ) : pet.photo ? (
                            <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">🐾</div>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-lg font-semibold text-gray-900">{pet.name || 'Unnamed'}</div>
                              <div className="text-sm text-gray-500 mt-0.5">{pet.species ? pet.species : ''}{pet.breed ? ` • ${pet.breed}` : ''}</div>
                            </div>
                            <div className="text-sm text-gray-600 text-right">
                              <div>{pet.age ? pet.age : ''}{pet.age && pet.gender ? ' • ' : ''}{pet.gender ? pet.gender : ''}</div>
                            </div>
                          </div>

                          <div className="mt-3 flex-1">
                            <div className="flex flex-wrap gap-2">
                              {(pet.traits || []).slice(0,4).map(t => (
                                <span key={t} className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{t}</span>
                              ))}
                            </div>

                            <p className="mt-3 text-sm text-gray-700 line-clamp-3">{pet.bio || 'No description provided.'}</p>
                          </div>

                          <div className="mt-4 flex items-center gap-3">
                            <button onClick={() => handleEditPet(pet)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-200 text-gray-700 hover:scale-[1.02] transition">Edit</button>
                            <button onClick={() => handleDeletePet(pet.id)} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-rose-500 text-white">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleFormCancel} />
          <div className="relative w-full max-w-3xl mx-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="p-6">
                <AddPetForm editingPet={editingPet} onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
