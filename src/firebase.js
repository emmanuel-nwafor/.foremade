import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// User Firebase configuration
let auth;
let db;
let storage;

try {
  const app = initializeApp({
    apiKey: "AIzaSyCRWR2Z2xlmcGBSVHEbbkIm9nL_qpTGSno",
    authDomain: "foremade-backend.firebaseapp.com",
    projectId: "foremade-backend",
    storageBucket: "foremade-backend.firebasestorage.app",
    messagingSenderId: "957543574407",
    appId: "1:957543574407:web:315572254cc0ba6b80c122"
  });
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Set persistence for user auth
  setPersistence(auth, browserLocalPersistence)
    .then(() => console.log('User auth persistence set to local'))
    .catch(error => console.error('Error setting user auth persistence:', error));

  console.log('Firebase initialized successfully for users');
} catch (error) {
  console.error('Firebase initialization error for users:', error);
  throw new Error('Failed to initialize Firebase for users. Check your configuration.');
}

export { auth, db, storage };