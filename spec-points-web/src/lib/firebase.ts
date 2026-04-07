import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCBf0Po55DuN2LM0c6IsPsoOmaVUmf6Z98',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'spec-points-prod.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'spec-points-prod',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'spec-points-prod.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1034624051135',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1034624051135:web:d6da31c805a5350efb230a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-JV4E69DEFM',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
