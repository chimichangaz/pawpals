import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { uploadImage, uploadImageAsBase64, testSupabaseConnection } from '../services/supabase';

// Template header image provided by the user
const HEADER_IMAGE = 'https://cdn.builder.io/api/v1/image/assets%2F720f9bd9b6b54adcb9360f64c8dfc2e3%2F11bfc152cc7f40b183bb9bb7412564e9?format=webp&width=800';

// ---------- Updated Moderation helper ----------
async function moderateImage(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  try {
    // Try the updated Hugging Face model endpoint
    const response = await fetch('https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: base64 })
    });

    if (!response.ok) {
      console.warn('Moderation API unavailable, skipping check');
      return true; // Allow upload if moderation service is down
    }

    const result = await response.json();

    if (!result || result.error) {
      console.warn('Moderation check failed:', result?.error);
      return true; // Allow upload if check fails
    }

    // Check for NSFW content - the model returns labels like "nsfw" or "normal"
    const nsfwItem = Array.isArray(result) 
      ? result.find(r => r.label?.toLowerCase().includes('nsfw'))
      : null;
    
    const nsfwScore = nsfwItem?.score || 0;
    
    if (nsfwScore > 0.7) { // Higher threshold for better accuracy
      throw new Error('Inappropriate image detected. Please upload a different photo.');
    }

    return true;
  } catch (err) {
    // If it's our custom error about inappropriate content, re-throw it
    if (err.message.includes('Inappropriate image')) {
      throw err;
    }
    // Otherwise, log the error and allow the upload
    console.warn('Moderation service error:', err.message);
    return true;
  }
}

// ---------- Main component ----------
function Profile() {
  const { currentUser, userProfile, getUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadMethod, setUploadMethod] = useState('supabase');

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: { city: '', state: '' },
    interests: [],
    profileImage: ''
  });

  useEffect(() => {
    if (currentUser && userProfile) {
      setFormData({
        displayName: currentUser.displayName || '',
        bio: userProfile.bio || '',
        location: {
          city: userProfile.location?.city || '',
          state: userProfile.location?.state || ''
        },
        interests: userProfile.interests || [],
        profileImage: userProfile.profileImage || ''
      });
    }
  }, [currentUser, userProfile]);

  // stats
  const [petsCount, setPetsCount] = useState(userProfile?.pets?.length || 0);
  const [eventsCount, setEventsCount] = useState(userProfile?.events?.length || 0);
  const [badgesCount, setBadgesCount] = useState(userProfile?.badges?.length || 0);

  useEffect(() => {
    setEventsCount(userProfile?.events?.length || 0);
    setBadgesCount(userProfile?.badges?.length || 0);

    async function fetchPetsCount() {
      if (!currentUser) return;
      try {
        if (userProfile?.pets?.length >= 0) {
          setPetsCount(userProfile.pets.length);
          return;
        }
        const petsCol = collection(db, 'pets');
        const q = query(petsCol, where('ownerId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        setPetsCount(snapshot.size || 0);
      } catch (err) {
        console.error('Failed to fetch pets count:', err);
      }
    }

    fetchPetsCount();
  }, [currentUser, userProfile]);

  const petInterests = [
    'Dogs', 'Cats', 'Birds', 'Rabbits', 'Fish', 'Reptiles',
    'Training', 'Grooming', 'Veterinary Care', 'Pet Photography',
    'Pet Sitting', 'Dog Walking', 'Rescue Work', 'Breeding',
    'Agility Training', 'Pet Nutrition', 'Pet Travel'
  ];

  function handleChange(e) {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (error) setError('');
    if (success) setSuccess('');
  }

  function handleInterestToggle(interest) {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
    if (error) setError('');
    if (success) setSuccess('');
  }

  // ---------- Updated image upload ----------
  async function handleImageUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // 1️⃣ Run moderation first (with graceful fallback)
      await moderateImage(file);

      // 2️⃣ Upload as usual
      let imageUrl;
      try {
        const isConnected = await testSupabaseConnection();
        if (!isConnected) throw new Error('Supabase connection failed');
        imageUrl = await uploadImage(file, 'profiles');
        setUploadMethod('supabase');
      } catch {
        imageUrl = await uploadImageAsBase64(file);
        setUploadMethod('base64');
      }

      setFormData(prev => ({ ...prev, profileImage: imageUrl }));
      setSuccess('Profile photo updated successfully!');
      e.target.value = '';
    } catch (err) {
      setError(err.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const userDocRef = doc(db, 'users', currentUser.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        const payload = {
          email: currentUser.email,
          displayName: formData.displayName.trim(),
          bio: formData.bio.trim(),
          location: {
            city: formData.location.city.trim(),
            state: formData.location.state.trim()
          },
          interests: formData.interests,
          profileImage: formData.profileImage,
          uploadMethod: uploadMethod,
          updatedAt: new Date()
        };
        if (!userDoc.exists()) {
          await setDoc(userDocRef, { ...payload, createdAt: new Date() });
        } else {
          await updateDoc(userDocRef, payload);
        }
      } catch (firestoreError) {
        throw new Error(`Database update failed: ${firestoreError.message}`);
      }

      try {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName.trim(),
          photoURL: formData.profileImage || null
        });
      } catch {
        // ignore auth errors
      }

      try {
        await getUserProfile(currentUser.uid);
      } catch {
        // ignore
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function cancelEdit() {
    if (currentUser && userProfile) {
      setFormData({
        displayName: currentUser.displayName || '',
        bio: userProfile.bio || '',
        location: {
          city: userProfile.location?.city || '',
          state: userProfile.location?.state || ''
        },
        interests: userProfile.interests || [],
        profileImage: userProfile.profileImage || ''
      });
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 flex items-center justify-center py-12">
        <div className="max-w-3xl w-full px-6">
          <div className="rounded-2xl bg-white/80 backdrop-blur-md p-10 shadow-2xl border border-white/30 text-center">
            <h3 className="text-2xl font-semibold text-gray-800">Please sign in to view your profile</h3>
            <p className="text-gray-600 mt-2">You need to be logged in to access your profile page.</p>
            <a href="/login" className="inline-block mt-6 px-6 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-semibold shadow">Sign In</a>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Render Profile UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
          <div className="h-16 bg-gradient-to-r from-indigo-100 via-rose-50 to-amber-50"></div>

          <div className="p-6 pt-0">
            <div className="-mt-12 flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white text-4xl font-semibold">{formData.displayName ? formData.displayName.charAt(0).toUpperCase() : 'U'}</div>
                  )}
                </div>

                <div className="pt-4">
                  <h2 className="text-2xl font-bold text-gray-800">{formData.displayName || 'No name set'}</h2>
                  <p className="text-sm text-gray-600 mt-1">{currentUser.email}</p>
                  {formData.location.city && (
                    <p className="text-sm text-gray-500 mt-1">📍 {formData.location.city}{formData.location.state && `, ${formData.location.state}`}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-medium shadow">Edit</button>
                ) : (
                  <button onClick={cancelEdit} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700">Cancel</button>
                )}
                <label htmlFor="profileImage" className={`cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-200 text-gray-700 shadow ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                  {uploading ? 'Uploading...' : 'Change'}
                </label>
                <input id="profileImage" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </div>
            </div>

            {/* Card content, form or display */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="col-span-2 space-y-4">
                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600">Full Name</label>
                      <input name="displayName" value={formData.displayName} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 focus:ring-2 focus:ring-emerald-200" placeholder="Your full name" required maxLength={50} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Location (City)</label>
                      <input name="location.city" id="location.city" value={formData.location.city} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 focus:ring-2 focus:ring-emerald-200" placeholder="City" maxLength={50} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">State / Region</label>
                      <input name="location.state" id="location.state" value={formData.location.state} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 focus:ring-2 focus:ring-emerald-200" placeholder="State / Region" maxLength={50} />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-600">About</label>
                      <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="mt-1 w-full rounded-lg border border-gray-200 p-2.5 focus:ring-2 focus:ring-emerald-200" placeholder="A short description about you and your pets" maxLength={1000}></textarea>
                      <div className="text-xs text-gray-400 mt-1">{formData.bio.length}/1000</div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-600">Interests</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {petInterests.map(interest => (
                          <label key={interest} className={`flex items-center gap-2 px-3 py-1 rounded-lg border cursor-pointer transition-colors ${formData.interests.includes(interest) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={formData.interests.includes(interest)} onChange={() => handleInterestToggle(interest)} className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm">{interest}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button type="submit" disabled={loading || uploading} className="px-6 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Display view */}
                  <div className="lg:col-span-1 space-y-3">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <div className="text-xs text-gray-500">Full Name</div>
                        <div className="text-lg text-gray-900 font-semibold">{formData.displayName || '—'}</div>
                        <div className="text-xs text-gray-500 mt-2">{currentUser.email}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Member since</div>
                        <div className="text-base text-gray-800">{auth.currentUser?.metadata?.creationTime ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString() : '—'}</div>
                        {formData.location.city && <div className="mt-2 text-sm text-gray-600">📍 {formData.location.city}{
                         formData.location.state && `, ${formData.location.state}`}</div>}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">About</div>
                      <div className="mt-2 text-sm text-gray-700">{formData.bio || 'No bio yet.'}</div>
                    </div>

                    {formData.interests.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500">Interests</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.interests.map(i => (
                            <span key={i} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm border border-emerald-100">{i}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white/50 border border-white/30 p-6 rounded-xl flex flex-col justify-between h-full">
                      <h4 className="text-sm font-semibold text-gray-800">Activity & Stats</h4>
                      <div className="mt-4 grid grid-cols-3 gap-6 text-center items-center">
                        <div>
                          <div className="text-xs text-gray-500">Pets</div>
                          <div className="text-3xl md:text-4xl font-extrabold text-gray-800">{petsCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Events</div>
                          <div className="text-3xl md:text-4xl font-extrabold text-gray-800">{eventsCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Badges</div>
                          <div className="text-3xl md:text-4xl font-extrabold text-gray-800">{badgesCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Shared action row */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-3">
                <button onClick={() => setIsEditing(true)} className="w-full text-sm px-4 py-3 rounded-md bg-gradient-to-r from-teal-600 to-cyan-500 text-white font-medium hover:from-teal-700 hover:to-cyan-600 transition-colors">Edit Profile</button>
                <label htmlFor="profileImage2" className="w-full text-sm inline-flex items-center justify-center px-4 py-3 rounded-md bg-white border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">Change Photo</label>
                <input id="profileImage2" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </div>
              <div className="flex flex-col gap-3">
                <a href="/my-pets" className="w-full text-sm inline-flex items-center justify-center px-4 py-3 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">View Pets</a>
                <a href="/events" className="w-full text-sm inline-flex items-center justify-center px-4 py-3 rounded-md bg-white border border-gray-200 hover:bg-gray-50 transition-colors">Browse Events</a>
              </div>
            </div>

            {/* Success / Error messages */}
            {(error || success) && (
              <div className="mt-6">
                {error && <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded-lg">{error}</div>}
                {success && <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">{success}</div>}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;