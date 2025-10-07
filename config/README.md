# Firebase Configuration for Vote Ledger

This directory contains the Firebase configuration files for the Vote Ledger application.

## Files

### `firebase.ts`
Main Firebase configuration file that initializes the Firebase app and services:
- Firebase App
- Authentication
- Firestore Database
- Storage

### `firebase-init.ts`
Helper file with TypeScript interfaces and initialization utilities:
- User interfaces for the voting system
- Collection constants
- Firebase service exports

### `firestore-rules.ts`
Contains Firestore and Storage security rules:
- User data protection
- Vote immutability
- Admin-only operations
- Data validation functions

### `firebase-config.example`
Example environment variables file for Firebase configuration.

## Setup Instructions

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication, Firestore, and Storage

2. **Get Configuration**
   - In Firebase Console, go to Project Settings
   - Copy the configuration values
   - Create `.env.local` file with your Firebase config

3. **Environment Variables**
   Copy `firebase-config.example` to `.env.local` and fill in your values:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Deploy Security Rules**
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login: `firebase login`
   - Initialize: `firebase init`
   - Deploy rules: `firebase deploy --only firestore:rules,storage`

## Collections Structure

- **users**: User profiles and admin status
- **candidates**: Election candidates information
- **elections**: Election details and status
- **votes**: Individual votes (immutable once cast)
- **voteCounts**: Real-time vote counting

## Security Features

- Users can only access their own data
- Votes are immutable once cast
- Admin operations are restricted to admin users
- Data validation on all write operations
- CNIC-based authentication for Pakistani voting system

## Development

The configuration automatically connects to Firebase emulators in development mode:
- Auth Emulator: `localhost:9099`
- Firestore Emulator: `localhost:8080`
- Storage Emulator: `localhost:9199`
