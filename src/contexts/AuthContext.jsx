import React, { createContext, useState, useContext, useEffect } from 'react';
import { vendorAuth as auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth provider');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed in context:', user?.uid);
      setVendor(user);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth provider');
      unsubscribe();
    };
  }, []);

  const value = {
    vendor,
    loading,
    isAuthenticated: !!vendor
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 