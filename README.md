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
