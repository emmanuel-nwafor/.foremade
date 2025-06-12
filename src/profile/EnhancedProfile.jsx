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
  const [mainProfileImage, setMainProfileImage] = useState(localStorage.getItem('profileImage') || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg');
  const mockWishlistCount = 3;
  const mockLoyaltyPoints = 0;
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (!user) {
        setError('Please sign in to view your profile.');
        setIsAuthError(true);
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
              email: user.email || 'test@example.com',
              username: firestoreData.username || user.displayName || 'emmachi789',
              name: firestoreData.name || user.displayName || 'Emmanuel Chinecherem',
              createdAt: firestoreData.createdAt || '2025-05-04T23:28:48.857Z',
              address: userAddresses[0]?.street
                ? `${userAddresses[0].street}, ${userAddresses[0].city}, ${userAddresses[0].state}, ${userAddresses[0].postalCode}, ${userAddresses[0].country}`
                : 'Not provided',
              country: firestoreData.country || 'Nigeria',
              phone: firestoreData.phone || '+234-8052975966',
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
      setMainProfileImage(localStorage.getItem('profileImage') || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg');
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
          <p className="text-gray-600 mt-4">Loading your profile...</p>
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
        <p className="text-red-600 mb-4">{error}</p>
        {isAuthError ? (
          <Link to="/login" className="text-blue-600 hover:underline inline-block relative overflow-hidden group">
            <span className="relative z-10">Go to Login</span>
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
            Retry
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
        <p className="text-red-600 mb-4">User data not available.</p>
        <motion.button
          onClick={() => setLoading(true)}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-8 text-gray-800"
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
              className="rounded-lg p-4 text-center bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:border-blue-200 cursor-pointer"
            >
              <Link to="/orders" className="block">
                <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}>
                  <i className="bx bx-package text-2xl text-blue-500 mb-2"></i>
                  <p className="text-gray-400">Orders</p>
                  <p className="text-lg font-semibold text-gray-800">9</p>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="rounded-lg p-4 text-center bg-gradient-to-br from-purple-50 to-white border border-purple-100 hover:border-purple-200 cursor-pointer"
            >
              <Link to="/favorites" className="block">
                <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}>
                  <i className="bx bx-heart text-2xl text-purple-500 mb-2"></i>
                  <p className="text-gray-400">Wish List</p>
                  <p className="text-lg font-semibold text-gray-800">{mockWishlistCount}</p>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="rounded-lg p-4 text-center bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 hover:border-yellow-200 cursor-pointer"
            >
              <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}>
                <i className="bx bx-star text-2xl text-yellow-500 mb-2"></i>
                <p className="text-gray-400">Loyalty Points</p>
                <p className="text-lg font-semibold text-gray-800">{mockLoyaltyPoints} <i className="bx bx-star text-yellow-500"></i></p>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div 
            className="rounded-lg p-6 mb-6 bg-white border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
            variants={itemVariants}
            onHoverStart={() => setActiveSection('personal')}
            onHoverEnd={() => setActiveSection(null)}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Personal Details</h3>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/setting"
                  className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition duration-200"
                >
                  <i className="bx bx-edit mr-1"></i> Edit Profile
                </Link>
              </motion.div>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <motion.div 
                className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-lg"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <img
                  src={mainProfileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg';
                  }}
                />
              </motion.div>
              
              <div className="ml-2">
                <motion.h2 
                  className="text-xl font-bold text-gray-800"
                  animate={{ 
                    color: activeSection === 'personal' ? "#3B82F6" : "#1F2937"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {userData.name}
                </motion.h2>
                <p className="text-gray-500">Member since {formatDate(userData.createdAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Username", value: userData.username },
                { label: "First Name", value: userData.name.split(' ')[0] },
                { label: "Last Name", value: userData.name.split(' ').slice(1).join(' ') || '-' },
                { label: "Email", value: userData.email, icon: "bx-check-circle", iconColor: "text-green-500" },
                { label: "Country", value: userData.country },
                { label: "Phone", value: userData.phone },
                { label: "Date Joined", value: formatDate(userData.createdAt) },
                { label: "Address", value: userData.address }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="group"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="p-3 rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors duration-300">
                    <p className="text-slate-400 text-sm">{item.label}</p>
                    <p className="font-semibold text-gray-800 flex items-center">
                      {item.value}
                      {item.icon && <i className={`bx ${item.icon} ml-2 ${item.iconColor}`}></i>}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="rounded-lg p-6 mb-6 bg-white border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
            variants={itemVariants}
            onHoverStart={() => setActiveSection('address')}
            onHoverEnd={() => setActiveSection(null)}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Address</h3>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/setting"
                  className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition duration-200"
                >
                  <i className="bx bx-map mr-1"></i> Update Address
                </Link>
              </motion.div>
            </div>
            <motion.div 
              className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-all duration-300"
              whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              animate={{ 
                backgroundColor: activeSection === 'address' ? "#EFF6FF" : "#F9FAFB"
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start">
                <i className="bx bx-map-pin text-blue-500 mr-2 text-xl mt-1"></i>
                <p className="font-semibold text-gray-800">{userData.address}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}