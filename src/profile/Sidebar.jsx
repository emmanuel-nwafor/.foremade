import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { User, Package, Heart, Map, Settings, CalendarCheck2, LayoutDashboard } from 'lucide-react'; // Importing lucide-react icons

// Validation functions (to match Register)
const generateUsername = (firstName, lastName) => {
  const nameParts = [firstName, lastName].filter(part => part?.trim());
  const firstPart = nameParts[0]?.slice(0, 4).toLowerCase() || 'user';
  const secondPart = nameParts[1]?.slice(0, 3).toLowerCase() || '';
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const usernameBase = (firstPart + secondPart).replace(/[^a-z0-9]/g, '');
  return usernameBase + randomNum;
};

export default function Sidebar() {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    username: 'guest',
    email: '',
    profileImage: localStorage.getItem('profileImage') || null,
  });
  const fallbackImage = 'https://via.placeholder.com/150?text=Profile';

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setUserData({
          firstName: '',
          lastName: '',
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
            const userData = docSnap.data();
            setUserData((prev) => ({
              ...prev,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              username: userData.username || generateUsername(userData.firstName || '', userData.lastName || ''),
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
          firstName: storedUserData.firstName || prev.firstName,
          lastName: storedUserData.lastName || prev.lastName,
          username: storedUserData.username || generateUsername(storedUserData.firstName || '', storedUserData.lastName || ''),
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
            setUserData((prev) => ({ ...prev, profileImage: fallbackImage }));
          }}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white text-lg font-bold uppercase rounded-full">
        {userData.email[0] || '?'}
      </div>
    );
  };

  return (
    <div className="md:w-1/4 dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-black">
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center overflow-hidden hover:bg-gray-300 transition-colors duration-300">
          {getAvatar()}
        </div>
        <h3 className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
          {userData.firstName} {userData.lastName || ''}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{userData.username}</p>
      </div>
      <nav className="flex flex-col space-y-2">
        <Link
          to="/profile"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-blue-800 p-2 rounded-lg transition-colors duration-300"
        >
          <User className="w-6 h-6 text-black dark:text-white" />
          <span>Profile</span>
        </Link>
        <Link
          to="/orders"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800 p-2 rounded-lg transition-colors duration-300"
        >
          <Package className="w-6 h-6 text-black dark:text-white" />
          <span>Orders</span>
        </Link>
        <Link
          to="/order-tracking"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-800 p-2 rounded-lg transition-colors duration-300"
        >
          <CalendarCheck2 className="w-6 h-6 text-black dark:text-white" />
          <span>Track Orders</span>
        </Link>
        <Link
          to="/favorites"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-800 p-2 rounded-lg transition-colors duration-300"
        >
          <Heart className="w-6 h-6 text-black dark:text-white" />
          <span>Favorites</span>
        </Link>
        <Link
          to="/address"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-800 p-2 rounded-lg transition-colors duration-300"
        >
          <Map className="w-6 h-6 text-black dark:text-white" />
          <span>Addresses</span>
        </Link>
        <Link
          to="/setting"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-800 p-2 rounded-lg transition-colors duration-300"
        >
          <Settings className="w-6 h-6 text-black dark:text-white" />
          <span>Settings</span>
        </Link>
        <Link
          to="/sell"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-800 p-2 rounded-lg transition-colors duration-300"
        >
          <LayoutDashboard className="w-6 h-6 text-black dark:text-white" />
          <span>My Dashbaord</span>
        </Link>
      </nav>
    </div>
  );
}