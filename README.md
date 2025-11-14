🐾 PawPals – Interactive Pet Management Platform

PawPals is a full-featured pet-management and community platform designed for modern pet owners.
It combines pet care tools, social networking, AI-powered assistance, and event discovery into one seamless experience.

Built with React.js and Firebase, with Flutter mobile apps (iOS/Android) currently in development.

🌟 Core Features
🐶 Pet Management

My Pets Dashboard – Create profiles for each pet with photos, breed info, age, and medical history

Pet Walker Tracking – Real-time GPS tracking during walks

Video Library – Pet care, grooming, and training content

AI Pet Assistant – Google Gemini–powered chatbot for:

Behaviour advice

Health guidance

Training tips

Nutrition queries

🌍 Community

Social Feed – Post updates, photos, and pet moments

Forums – Discuss training, health, breeds, and local topics

Events Calendar – Explore and join pet-friendly events and meetups

🛍️ Services

Browse Pets – Pets available for adoption

Vet Finder – Locate nearby vet clinics using geo-search

FAQ Hub – AI-enhanced question answering for common pet care issues

🔐 Safety & Moderation

AI Image Moderation
Uses Hugging Face – falconsai/nsfw_image_detection for automated scanning

Graceful Degradation
App continues working even if moderation API fails

Content Filtering & Community Standards

👤 User Features

Firebase Authentication (Email/Password + Google Sign-In)

Customizable user profiles

Location, interests, and activity stats

Dual storage system:

Supabase (primary)

Base64 fallback for environments without bucket access

Activity tracking (events, pets, badges)

🧰 Technology Stack
Frontend-

React.js

Context API (state management)

React Router

Backend-

Firebase Authentication

Firebase Firestore

Firebase Storage

Supabase Storage

AI Services-

Google Gemini API

Hugging Face API

Future-

Flutter / Dart mobile apps (iOS + Android)



🚀 Setup Instructions
Prerequisites

Node.js (v14+)

Firebase account

Supabase project

Google Cloud (Gemini API)

Hugging Face account

1. Clone the Repository
git clone https://github.com/yourusername/pawpals.git
cd pawpals
npm install

2. Firebase Setup

Create a project

Enable Authentication

Create a Firestore database

Enable Storage

Copy your Firebase config into firebase.js

3. Supabase Setup

Create a Supabase project

Create a public bucket (e.g., profiles/)

Copy URL + anon key into environment variables

4. API Keys

Gemini API: Google AI Studio

Hugging Face Access Token

5. Environment Variables

Create .env:

# Firebase
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Supabase
REACT_APP_SUPABASE_URL=your_url
REACT_APP_SUPABASE_ANON_KEY=your_key

# AI
REACT_APP_GEMINI_API_KEY=your_gemini_key
REACT_APP_HF_TOKEN=your_huggingface_token

6. Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /pets/{petId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        resource.data.ownerId == request.auth.uid;
    }

    match /events/{eventId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        resource.data.creatorId == request.auth.uid;
    }

    match /forum/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        resource.data.authorId == request.auth.uid;
    }
  }
}

7. Storage Rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.resource.size < 5 * 1024 * 1024 &&
        request.resource.contentType.matches('image/.*');
    }
  }
}

8. Start Development Server
npm start

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/e9f2c286-1f07-497e-98ce-b9014c32c5b8" />
