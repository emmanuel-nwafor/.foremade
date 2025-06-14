import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Spinner from '../components/common/Spinner';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  const [userData, setUserData] = useState(null);
  const [mainProfileImage, setMainProfileImage] = useState(localStorage.getItem('profileImage') || null);
  const mockWishlistCount = 3;
  const mockLoyaltyPoints = 0;
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (!user) {
        setError('Please sign in to view your profile.');
        setIsAuthError(true);
        setMainProfileImage(null);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const firestoreData = docSnap.data();
            const userAddresses = firestoreData.addresses || [];
            setUserData({
              email: user.email || '',
              username: firestoreData.username || user.displayName || 'emmachi789',
              name: firestoreData.name || user.displayName || 'Emmanuel Chinecherem',
              createdAt: firestoreData.createdAt || '2025-05-04T23:28:48.857Z',
              address: userAddresses[0]?.street
                ? `${userAddresses[0].street}, ${userAddresses[0].city}, ${userAddresses[0].state}, ${userAddresses[0].postalCode}, ${userAddresses[0].country}`
                : 'Not provided',
              country: firestoreData.country || '',
              phone: firestoreData.phone || '',
              uid: user.uid,
            });
          } else {
            setError('User profile not found.');
          }
        });

        setLoading(false);
        return () => unsubscribeUser();
      } catch (err) {
        if (err.code === 'permission-denied') {
          setError('You do not have permission to view this profile.');
          setIsAuthError(true);
        } else {
          setError('Failed to load profile. Please try again.');
        }
        setLoading(false);
      }
    });

    const handleProfileImageUpdate = () => {
      const image = localStorage.getItem('profileImage') || null;
      setMainProfileImage(image);
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    return () => {
      unsubscribe();
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return 'Not available';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  const getAvatar = () => {
    if (mainProfileImage) {
      return (
        <img
          src={mainProfileImage}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={() => setMainProfileImage(null)}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white text-2xl font-bold uppercase">
        {userData?.email ? userData.email[0] : 'U'}
      </div>
    );
  };

  // Define animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Spinner />
          <p className="text-gray-600 dark:text-gray-300 mt-4">Loading your profile...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="container mx-auto px-4 py-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        {isAuthError ? (
          <Link to="/login" className="text-blue-600 hover:underline inline-block relative overflow-hidden group">
            <span className="relative z-10">Go to Login 🔐</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
          </Link>
        ) : (
          <motion.button
            onClick={() => {
              setError('');
              setLoading(true);
            }}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Retry 🔄
          </motion.button>
        )}
      </motion.div>
    );
  }

  if (!userData) {
    return (
      <motion.div
        className="container mx-auto px-4 py-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-red-600 dark:text-red-400 mb-4">User data not available.</p>
        <motion.button
          onClick={() => setLoading(true)}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Retry 🔄
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-700"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar />
        <div className="md:w-3/4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"
            variants={itemVariants}
          >
            <motion.div
              whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="rounded-lg p-4 text-center bg-gradient-to-br from-blue-50 to-white dark:from-blue-900 dark:to-gray-800 border border-blue-100 dark:border-blue-700 hover:border-blue-200 dark:hover:border-blue-600 cursor-pointer"
            >
              <Link to="/orders" className="block">
                <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}>
                  <i className="bx bx-package text-2xl text-blue-500 mb-2"></i>
                  <p className="text-gray-400 dark:text-gray-300">Orders 📦</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">9</p>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="rounded-lg p-4 text-center bg-gradient-to-br from-purple-50 to-white dark:from-purple-900 dark:to-gray-800 border border-purple-100 dark:border-purple-700 hover:border-purple-200 dark:hover:border-purple-600 cursor-pointer"
            >
              <Link to="/favorites" className="block">
                <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}>
                  <i className="bx bx-heart text-2xl text-purple-500 mb-2"></i>
                  <p className="text-gray-400 dark:text-gray-300">Wish List ❤️</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{mockWishlistCount}</p>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="rounded-lg p-4 text-center bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900 dark:to-gray-800 border border-yellow-100 dark:border-yellow-700 hover:border-yellow-200 dark:hover:border-yellow-600 cursor-pointer"
            >
              <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}>
                <i className="bx bx-star text-2xl text-yellow-500 mb-2"></i>
                <p className="text-gray-400 dark:text-gray-300">Loyalty Points 🌟</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{mockLoyaltyPoints} <i className="bx bx-star text-yellow-500"></i></p>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="rounded-lg p-6 mb-6 bg-gray-50 dark:bg-gray-800 shadow-md"
            variants={itemVariants}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Personal Details 📋</h3>
              <Link
                to="/setting"
                className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition duration-200"
              >
                <i className="bx bx-edit mr-1"></i> Edit Profile ✏️
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shadow">
                {getAvatar()}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 dark:text-gray-300">Username</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{userData.username}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-300">First Name</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{userData.name.split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-300">Last Name</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{userData.name.split(' ').slice(1).join(' ') || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-300">Email</p>
                <p className="font-semibold flex items-center text-gray-800 dark:text-gray-200">
                  {userData.email}
                  <i className="bx bx-check-circle ml-2 text-green-500"></i>
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-300">Country</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{userData.country}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-300">Phone</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{userData.phone}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-300">Date Joined</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{formatDate(userData.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-300">Address</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{userData.address}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-lg p-6 mb-6 bg-gray-50 dark:bg-gray-800 shadow-md"
            variants={itemVariants}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Address 📍</h3>
              <Link
                to="/setting"
                className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition duration-200"
              >
                <i className="bx bx-map mr-1"></i> Update Address 🗺️
              </Link>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="font-semibold text-gray-800 dark:text-gray-200">{userData.address}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}