import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';

export default function Sidebar() {
  const [userData, setUserData] = useState({
    name: 'Emmanuel Chinecherem',
    username: 'emmaChi',
    profileImage: localStorage.getItem('profileImage') || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg',
  });
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const firestoreData = docSnap.data();
          setUserData((prev) => ({
            ...prev,
            name: firestoreData.name || user.displayName || 'Emmanuel Chinecherem',
            username: firestoreData.username || 'emmaChi',
          }));
        }
      });

      const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
      const ordersSnap = await getDocs(ordersQuery);
      setOrderCount(ordersSnap.docs.length);

      return () => unsubscribeUser();
    });

    const handleProfileImageUpdate = () => {
      setUserData((prev) => ({
        ...prev,
        profileImage: localStorage.getItem('profileImage') || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg',
      }));
    };

    const handleUserDataUpdate = () => {
      const storedUserData = JSON.parse(localStorage.getItem('userData'));
      if (storedUserData) {
        setUserData((prev) => ({
          ...prev,
          name: storedUserData.name || prev.name,
          username: storedUserData.username || prev.username,
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

  return (
    <div className="md:w-1/4 bg-gray-50 p-6 rounded-lg shadow-md">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          <img
            src={userData.profileImage}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg';
            }}
          />
        </div>
        <h3 className="mt-2 text-lg font-semibold text-gray-800">
          {userData.name.split(' ')[0]}
        </h3>
        <p className="text-gray-600 text-sm">{userData.username}</p>
      </div>
      <nav className="flex flex-col space-y-2">
        <Link
          to="/profile"
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
        >
          <i className="bx bx-user text-lg"></i>
          <span>Profile</span>
        </Link>
        <Link
          to="/orders"
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
        >
          <i className="bx bx-package text-lg"></i>
          <span>Orders ({orderCount})</span>
        </Link>
        <Link
          to="/favorites"
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
        >
          <i className="bx bx-heart text-lg"></i>
          <span>Wishlist ({wishlistCount})</span>
        </Link>
        <Link
          to="/address"
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
        >
          <i className="bx bx-map text-lg"></i>
          <span>Addresses</span>
        </Link>
        <Link
          to="/setting"
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
        >
          <i className="bx bx-cog text-lg"></i>
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}