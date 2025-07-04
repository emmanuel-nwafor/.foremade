import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Sidebar() {
  const [userData, setUserData] = useState({
    name: 'Emmanuel Chinecherem',
    username: 'emmaChi',
    email: '',
    profileImage: localStorage.getItem('profileImage') || null,
  });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setUserData({
          name: 'Guest',
          username: 'guest',
          email: '',
          profileImage: null,
        });
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const firestoreData = docSnap.data();
            setUserData((prev) => ({
              ...prev,
              name: firestoreData.name || user.displayName || 'Emmanuel Chinecherem',
              username: firestoreData.username || 'emmaChi',
              email: user.email || '',
            }));
          }
        });

        return () => unsubscribeUser();
      } catch (err) {
        console.error('Error fetching sidebar data:', err);
      }
    });

    const handleProfileImageUpdate = () => {
      setUserData((prev) => ({
        ...prev,
        profileImage: localStorage.getItem('profileImage') || null,
      }));
    };

    const handleUserDataUpdate = () => {
      const storedUserData = JSON.parse(localStorage.getItem('userData'));
      if (storedUserData) {
        setUserData((prev) => ({
          ...prev,
          name: storedUserData.name || prev.name,
          username: storedUserData.username || prev.username,
          email: storedUserData.email || prev.email,
        }));
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    return () => {
      unsubscribeAuth();
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, []);

  const getAvatar = () => {
    if (userData.profileImage) {
      return (
        <img
          src={userData.profileImage}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={() => {
            setUserData((prev) => ({ ...prev, profileImage: null }));
          }}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white text-lg font-bold uppercase rounded-full">
        {userData.email ? userData.email[0] : 'U'}
      </div>
    );
  };

  return (
    <div className="md:w-1/4 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center overflow-hidden">
          {getAvatar()}
        </div>
        <h3 className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
          {userData.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{userData.username}</p>
      </div>
      <nav className="flex flex-col space-y-2">
        <Link
          to="/profile"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg"
        >
          <i className="bx bx-user text-lg text-blue-500 dark:text-blue-400"></i>
          <span>Profile</span>
        </Link>
        <Link
          to="/orders"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 p-2 rounded-lg"
        >
          <i className="bx bx-package text-lg text-green-500 dark:text-green-400"></i>
          <span>Orders</span>
        </Link>
        <Link
          to="/favorites"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg"
        >
          <i className="bx bx-heart text-lg text-red-500 dark:text-red-400"></i>
          <span>Wishlist</span>
        </Link>
        <Link
          to="/address"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 p-2 rounded-lg"
        >
          <i className="bx bx-map text-lg text-purple-500 dark:text-purple-400"></i>
          <span>Addresses</span>
        </Link>
        <Link
          to="/setting"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 p-2 rounded-lg"
        >
          <i className="bx bx-cog text-lg text-orange-500 dark:text-orange-400"></i>
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}