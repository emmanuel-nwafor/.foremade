import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Spinner from '../components/common/Spinner';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  const [userData, setUserData] = useState(null);
  const [mainProfileImage, setMainProfileImage] = useState(localStorage.getItem('profileImage') || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg');
  const mockWishlistCount = 3;
  const mockWalletBalance = 100.50;
  const mockLoyaltyPoints = 0;

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">{error}</p>
        {isAuthError ? (
          <Link to="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        ) : (
          <button
            onClick={() => {
              setError('');
              setLoading(true);
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">User data not available.</p>
        <button
          onClick={() => setLoading(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800">
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar />
        <div className="md:w-3/4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Link to="/orders" className="rounded-lg p-4 text-center bg-gray-50 hover:bg-gray-100 transition">
              <p className="text-gray-400">Orders</p>
              <p className="text-lg font-semibold text-gray-800">9</p>
            </Link>
            <div className="rounded-lg p-4 text-center bg-gray-50">
              <p className="text-gray-400">Wish List</p>
              <p className="text-lg font-semibold text-gray-800">{mockWishlistCount}</p>
            </div>
            <div className="rounded-lg p-4 text-center bg-gray-50">
              <p className="text-gray-400">Wallet</p>
              <p className="text-lg font-semibold text-gray-800">₦{mockWalletBalance.toFixed(2)}</p>
            </div>
            <div className="rounded-lg p-4 text-center bg-gray-50">
              <p className="text-gray-400">Loyalty Points</p>
              <p className="text-lg font-semibold text-gray-800">{mockLoyaltyPoints} <i className="bx bx-star text-yellow-500"></i></p>
            </div>
          </div>
          <div className="rounded-lg p-6 mb-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Personal Details</h3>
              <Link
                to="/setting"
                className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition duration-200"
              >
                <i className="bx bx-edit mr-1"></i> Edit Profile
              </Link>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src={mainProfileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg';
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400">Username</p>
                <p className="font-semibold text-gray-800">{userData.username}</p>
              </div>
              <div>
                <p className="text-slate-400">First Name</p>
                <p className="font-semibold text-gray-800">{userData.name.split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-slate-400">Last Name</p>
                <p className="font-semibold text-gray-800">{userData.name.split(' ').slice(1).join(' ') || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400">Email</p>
                <p className="font-semibold flex items-center text-gray-800">
                  {userData.email}
                  <i className="bx bx-check-circle ml-2 text-green-500"></i>
                </p>
              </div>
              <div>
                <p className="text-slate-400">Country</p>
                <p className="font-semibold text-gray-800">{userData.country}</p>
              </div>
              <div>
                <p className="text-slate-400">Phone</p>
                <p className="font-semibold text-gray-800">{userData.phone}</p>
              </div>
              <div>
                <p className="text-slate-400">Date Joined</p>
                <p className="font-semibold text-gray-800">{formatDate(userData.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">Address</p>
                <p className="font-semibold text-gray-800">{userData.address}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-6 mb-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Address</h3>
              <Link
                to="/setting"
                className="flex items-center px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition duration-200"
              >
                <i className="bx bx-map mr-1"></i> Update Address
              </Link>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="font-semibold text-gray-800">{userData.address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}