// src/components/SupabaseTest.js
import React, { useState } from 'react';
import { testSupabaseConnection, uploadImage } from '../services/supabase';

function SupabaseTest() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const testConnection = async () => {
    setLoading(true);
    setStatus('Testing connection...');
    try {
      const isConnected = await testSupabaseConnection();
      setStatus(isConnected ? '✅ Connected successfully!' : '❌ Connection failed');
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  const testUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setStatus('Uploading test image...');
    try {
      const url = await uploadImage(file, 'test');
      setImageUrl(url);
      setStatus(`✅ Upload successful! URL: ${url}`);
    } catch (error) {
      setStatus(`❌ Upload failed: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', borderRadius: '8px' }}>
      <h3>Supabase Connection Test</h3>
      <button onClick={testConnection} disabled={loading}>
        Test Supabase Connection
      </button>
      <input type="file" onChange={testUpload} disabled={loading} />
      <div style={{ marginTop: '10px' }}>
        <strong>Status:</strong> {status}
      </div>
      {imageUrl && (
        <div style={{ marginTop: '10px' }}>
          <img src={imageUrl} alt="Test upload" style={{ maxWidth: '200px', maxHeight: '200px' }} />
        </div>
      )}
    </div>
  );
}

export default SupabaseTest;