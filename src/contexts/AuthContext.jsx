import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase'; // <-- use main auth, not vendorAuth
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Change vendor to user for consistency
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth provider');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed in context:', user?.uid);
      setUser(user);
      setLoading(false);
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            setUserProfile(null);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      console.log('Cleaning up auth provider');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};