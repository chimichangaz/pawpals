PawPals - Interactive Pet Management Platform 🐾
PawPals is a comprehensive pet management platform that connects pet owners with essential services and community features. Built with React and Firebase, with a Flutter mobile app in development.
Core Features
Pet Management

My Pets Dashboard: Store pet profiles with photos, health records, and information
Pet Walker Tracking: Real-time GPS tracking during walks
Video Library: Pet care and training resources
AI Chatbot: Google Gemini-powered assistant for pet care questions, behavior advice, and health guidance

Community

Social Network: Connect with other pet owners and share updates
Forums: Discuss pet care, training, breed advice, and local events
Events Calendar: Discover and join pet-friendly events and meetups

Services

Browse Pets: Explore pets available for adoption
Vet Finder: Locate nearby veterinary clinics
FAQ: Common pet care questions with AI-enhanced answers

Safety Features

AI Content Moderation: Hugging Face's Falconsai/nsfw_image_detection model automatically scans uploaded images
Graceful Degradation: System continues functioning if moderation service is unavailable
Community Standards: Automated filtering keeps content family-friendly

User Features

Firebase Authentication (Email/Password + Google Sign-In)
Customizable profiles with bio, location, interests, and stats
Dual image storage (Supabase with Base64 fallback)
Activity tracking (pets, events, badges)

Technology Stack
Frontend: React.js, Context API for state management
Backend: Firebase (Auth, Firestore, Storage)
AI Services: Google Gemini API, Hugging Face API
Storage: Supabase + Base64 fallback
Future: Flutter mobile apps (iOS/Android)

🏗️ Architecture
System Overview
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  React.js Single Page Application (SPA)            │     │
│  │  • Components (auth, common, events, pets,         │     │
│  │    profile, social, pages)                         │     │
│  │  • Context API (AuthContext)                       │     │
│  │  • Routing & Navigation                            │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Firebase   │  │   Supabase   │  │  External    │      │
│  │   Service    │  │   Service    │  │   APIs       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Firebase    │  │   Supabase   │  │  AI Services │      │
│  │              │  │              │  │              │      │
│  │ • Auth       │  │ • Storage    │  │ • Gemini API │      │
│  │ • Firestore  │  │   Buckets    │  │ • Hugging    │      │
│  │ • Storage    │  │              │  │   Face API   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
Component Structure
src/
├── components/
│   ├── auth/              # Login, Register
│   ├── common/            # Navbar, shared UI
│   ├── events/            # Event listing, creation
│   ├── pets/              # AddPetForm, PetCard
│   ├── profile/           # Profile management
│   └── social/            # PetChatbot (Gemini)
├── context/
│   └── AuthContext.js     # Global auth state
├── services/
│   ├── firebase.js        # Firebase config
│   ├── supabase.js        # Storage integration
│   ├── events.service.js  # Event CRUD
│   ├── forum.service.js   # Forum CRUD
│   └── pets.service.js    # Pet CRUD
├── pages/                 # Route components
└── styles/                # CSS
Data Flows
1. Authentication
User Input → AuthContext → Firebase Auth → Update State → Store in Firestore
2. Image Upload with Moderation
User selects image 
    → Hugging Face NSFW detection
    → [Pass] Supabase upload (or Base64 fallback)
    → Update Firestore
    → Re-render UI
3. AI Chatbot
User message → PetChatbot → Gemini API → Response → Display
4. Data Operations
Component → Service Layer → Firebase/Supabase → Update local state → Re-render
Architectural Patterns

Context-based state: AuthContext eliminates prop drilling
Service layer: Abstracts all backend operations from UI
Component composition: Reusable, modular components
Defensive programming: Graceful fallbacks and error handling
Security-first: Multi-layer protection (auth, rules, moderation, validation)

Database Schema (Firestore)
users/{userId}
javascript{
  email: string,
  displayName: string,
  bio: string,
  location: { city: string, state: string },
  interests: string[],
  profileImage: string,
  pets: reference[],
  events: reference[],
  badges: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
pets/{petId}
javascript{
  ownerId: string,
  name: string,
  species: string,
  breed: string,
  age: number,
  photos: string[],
  healthRecords: object[],
  createdAt: timestamp
}
events/{eventId}
javascript{
  creatorId: string,
  title: string,
  description: string,
  date: timestamp,
  location: object,
  attendees: string[],
  createdAt: timestamp
}
forum/{postId}
javascript{
  authorId: string,
  title: string,
  content: string,
  category: string,
  comments: object[],
  likes: number,
  createdAt: timestamp
}

Setup Instructions
Prerequisites

Node.js (v14+) and npm/yarn
Firebase account
Supabase account
Google Cloud account (Gemini API)
Hugging Face account

1. Clone and Install
bashgit clone https://github.com/yourusername/pawpals.git
cd pawpals
npm install
2. Firebase Setup

Create project at Firebase Console
Enable Authentication (Email/Password + Google)
Create Firestore database
Enable Storage
Copy config from Project Settings

3. Supabase Setup

Create project at Supabase
Create profiles storage bucket (set to public)
Copy Project URL and API key

4. API Keys

Gemini: Get key from Google AI Studio
Hugging Face: Create token at Settings → Access Tokens

5. Environment Variables
Create .env file:
env# Firebase
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Supabase
REACT_APP_SUPABASE_URL=your_url
REACT_APP_SUPABASE_ANON_KEY=your_key

# AI Services
REACT_APP_GEMINI_API_KEY=your_gemini_key
REACT_APP_HF_TOKEN=your_huggingface_token
6. Firestore Security Rules
javascriptrules_version = '2';
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
7. Storage Security Rules
javascriptrules_version = '2';
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
8. Run Development Server
bashnpm start
