// src/services/supabase.js - FIXED VERSION with better error handling
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qibrspzqpzxwfhxcdobk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpYnJzcHpxcHp4d2ZoeGNkb2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTI3NjMsImV4cCI6MjA3Mjk4ODc2M30.IFnTGAo8gq9RdVQSHWbFyQILoXyEOgIfpSCSPmceaEQ'

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key present:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Enhanced image upload function with fallback options
export async function uploadImage(file, folder = 'pets') {
  try {
    console.log('=== UPLOAD DEBUG START ===');
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      folder: folder
    });

    // Validate file
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }
    
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    const fileExt = file.name.split('.').pop().toLowerCase()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    
    console.log('Upload path:', fileName);

    // First, let's try to create the bucket if it doesn't exist
    try {
      const { error: createBucketError } = await supabase.storage.createBucket('pawpals-images', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (createBucketError && createBucketError.message !== 'Bucket already exists') {
        console.log('Bucket creation error (might be expected):', createBucketError);
      }
    } catch (bucketError) {
      console.log('Bucket creation attempt failed:', bucketError);
    }

    // Try the upload
    const { data, error } = await supabase.storage
      .from('pawpals-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error details:', error);
      
      // Provide specific error messages
      if (error.message.includes('Bucket not found')) {
        throw new Error('Image storage is not properly configured. Please contact support or try again later.');
      } else if (error.message.includes('Policy')) {
        throw new Error('Permission denied for image upload. Please check your account permissions.');
      } else if (error.message.includes('size')) {
        throw new Error('Image file is too large. Please use an image smaller than 5MB.');
      } else {
        throw new Error(`Upload failed: ${error.message}`);
      }
    }

    console.log('Upload success data:', data);

    // Get public URL
    const { data: publicURLData } = supabase.storage
      .from('pawpals-images')
      .getPublicUrl(fileName)

    console.log('Public URL:', publicURLData.publicUrl);
    console.log('=== UPLOAD DEBUG END ===');
    
    return publicURLData.publicUrl
  } catch (error) {
    console.error('=== UPLOAD ERROR ===', error)
    
    // If Supabase fails, provide a fallback message
    if (error.message.includes('storage') || error.message.includes('bucket')) {
      throw new Error('Image upload service is temporarily unavailable. Please try again later or contact support.');
    }
    
    throw error;
  }
}

// Alternative upload using base64 (as fallback if Supabase storage fails)
export async function uploadImageAsBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file'));
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64
      reject(new Error('For this upload method, image size must be less than 2MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result); // This will be a data URL (base64)
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    reader.readAsDataURL(file);
  });
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test storage access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    if (bucketError) {
      console.error('Storage test failed:', bucketError);
      return false;
    }

    console.log('Storage buckets:', buckets);
    
    // Check if our bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === 'pawpals-images');
    console.log('pawpals-images bucket exists:', bucketExists);
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}