import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
  console.log('Firebase initialized successfully for users');
} catch (error) {
  console.error('Firebase initialization error for users:', error);
  throw new Error('Failed to initialize Firebase for users. Check your configuration.');
}

// Vendor Firebase configuration
let vendorAuth;
let vendorDb;
let vendorStorage;

try {
  const vendorApp = initializeApp({
    apiKey: "AIzaSyBCJ66zthIZWbotDrugJCd63KbokscgV7g",
    authDomain: "foremade-database.firebaseapp.com",
    projectId: "foremade-database",
    storageBucket: "foremade-database.firebasestorage.app",
    messagingSenderId: "519808269327",
    appId: "1:519808269327:web:accc580a777f6a1fdcf77a",
    measurementId: "G-93V0N3FJSN"
  }, 'vendorApp');
  vendorAuth = getAuth(vendorApp);
  vendorDb = getFirestore(vendorApp);
  vendorStorage = getStorage(vendorApp);
  console.log('Firebase initialized successfully for vendors');
} catch (error) {
  console.error('Firebase initialization error for vendors:', error);
  throw new Error('Failed to initialize Firebase for vendors. Check your configuration.');
}

export { auth, db, storage, vendorAuth, vendorDb, vendorStorage };