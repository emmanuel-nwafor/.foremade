import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Package, Heart, Star, User } from 'lucide-react';

const generateUsername = (firstName, lastName) => {
  const nameParts = [firstName, lastName].filter(part => part?.trim());
  const firstPart = nameParts[0]?.slice(0, 4).toLowerCase() || 'user';
  const secondPart = nameParts[1]?.slice(0, 3).toLowerCase() || '';
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const usernameBase = (firstPart + secondPart).replace(/[^a-z0-9]/g, '');
  return usernameBase + randomNum;
};

const getAvatar = (imageUrl) => {
  return imageUrl || 'https://i.pinimg.com/736x/b8/0d/02/b80d025503e3f7c2008b450a46716ae1.jpg';
};

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  const [userData, setUserData] = useState(null);
  const [mainProfileImage, setMainProfileImage] = useState(localStorage.getItem('profileImage') || null);
  const [proStatus, setProStatus] = useState('standard');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
  });
  const [editErrors, setEditErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe = null;
    const maxRetries = 3;
    let retryCount = 0;

    const fetchProfile = async () => {
      setLoading(true);
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          setError('Please sign in to view your profile.');
          setIsAuthError(true);
          setMainProfileImage(null);
          setLoading(false);
          return;
        }

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const tryFetchProfile = () => {
            return new Promise((resolve, reject) => {
              const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                  const firestoreData = docSnap.data();
                  const userAddresses = firestoreData.addresses || [];
                  setUserData({
                    email: user.email || '',
                    username: firestoreData.username || generateUsername(firestoreData.firstName || '', firestoreData.lastName || ''),
                    firstName: firestoreData.firstName || '',
                    lastName: firestoreData.lastName || '',
                    createdAt: firestoreData.createdAt || new Date().toISOString(),
                    address: userAddresses[0]?.street
                      ? `${userAddresses[0].street}, ${userAddresses[0].city || ''}, ${userAddresses[0].state || ''}, ${userAddresses[0].postalCode || ''}, ${userAddresses[0].country || ''}`
                      : 'Not provided',
                    country: firestoreData.country || 'Not provided',
                    phone: firestoreData.phoneNumber || 'Not provided',
                    uid: user.uid,
                  });
                  setEditForm({
                    firstName: firestoreData.firstName || '',
                    lastName: firestoreData.lastName || '',
                    phone: firestoreData.phoneNumber || '',
                    address: userAddresses[0]?.street || '',
                    currentPassword: '',
                    newPassword: '',
                  });
                  setProStatus(firestoreData.proStatus || 'standard');
                  setMainProfileImage(firestoreData.profileImage || localStorage.getItem('profileImage') || null);
                  setError('');
                  setLoading(false);
                  resolve();
                } else if (retryCount < maxRetries) {
                  retryCount++;
                  setTimeout(() => tryFetchProfile(), 1000); // Retry after 1s
                } else {
                  setError('User profile not found. Please complete your profile.');
                  setUserData({
                    email: user.email || '',
                    username: '',
                    firstName: '',
                    lastName: '',
                    createdAt: new Date().toISOString(),
                    address: 'Not provided',
                    country: 'Not provided',
                    phone: 'Not provided',
                    uid: user.uid,
                  });
                  setEditForm({
                    firstName: '',
                    lastName: '',
                    phone: '',
                    address: '',
                    currentPassword: '',
                    newPassword: '',
                  });
                  setLoading(false);
                  resolve();
                }
              }, (err) => {
                setError('Failed to load profile data. Please try again.');
                setLoading(false);
                reject(err);
              });
              return unsubscribeSnapshot;
            });
          };

          await tryFetchProfile();
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
    };

    fetchProfile();

    const handleProfileImageUpdate = () => {
      const image = localStorage.getItem('profileImage') || null;
      setMainProfileImage(image);
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, []);

  const handleImageError = () => {
    setMainProfileImage(null);
  };

  const handleEditInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEditForm = () => {
    const newErrors = {};
    if (!editForm.firstName) newErrors.firstName = 'First name is required';
    if (!editForm.lastName) newErrors.lastName = 'Last name is required';
    if (!editForm.phone) newErrors.phone = 'Phone number is required';
    if (!editForm.address) newErrors.address = 'Address is required';
    if (editForm.newPassword && !editForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required to update password';
    }
    if (editForm.newPassword && editForm.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    }
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to update your profile.');
        setIsAuthError(true);
        setLoading(false);
        return;
      }

      // Update Firestore profile
      const userDocRef = doc(db, 'users', user.uid);
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          await setDoc(userDocRef, {
            firstName: editForm.firstName,
            lastName: editForm.lastName,
            username: generateUsername(editForm.firstName, editForm.lastName),
            phoneNumber: editForm.phone,
            addresses: [{ street: editForm.address, city: '', state: '', postalCode: '', country: userData?.country || 'Nigeria' }],
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          break;
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            throw new Error('Failed to update profile in Firestore after multiple attempts.');
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }

      // Update Firebase Auth displayName
      await updateProfile(user, { displayName: `${editForm.firstName} ${editForm.lastName}` });

      // Update password if provided
      if (editForm.newPassword && editForm.currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, editForm.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, editForm.newPassword);
      }

      setEditForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      setIsEditing(false);
      setError('');
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      if (err.code === 'auth/wrong-password') {
        setEditErrors(prev => ({ ...prev, currentPassword: 'Incorrect current password' }));
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (err.code === 'auth/user-token-expired') {
        setError('Your session has expired. Please sign in again.');
        setIsAuthError(true);
        navigate('/login');
      } else {
        setError('Failed to update profile. Please try again.');
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center space-y-4 w-full max-w-md">
          <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (isAuthError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link to="/login" className="text-blue-600 hover:underline dark:text-blue-400">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                <img
                  src={getAvatar(mainProfileImage)}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                  onError={handleImageError}
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                  {userData?.firstName} {userData?.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">@{userData?.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Joined: {new Date(userData?.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-lg mb-6">
              {error}
              {error.includes('not found') && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-2 text-blue-600 hover:underline dark:text-blue-400"
                >
                  Complete Profile
                </button>
              )}
            </div>
          )}

          {isEditing && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Edit Profile</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={editForm.firstName}
                    onChange={e => handleEditInputChange('firstName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {editErrors.firstName && <p className="text-red-500 text-xs mt-1">{editErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={editForm.lastName}
                    onChange={e => handleEditInputChange('lastName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {editErrors.lastName && <p className="text-red-500 text-xs mt-1">{editErrors.lastName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={editForm.phone}
                    onChange={e => handleEditInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {editErrors.phone && <p className="text-red-500 text-xs mt-1">{editErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Address"
                    value={editForm.address}
                    onChange={e => handleEditInputChange('address', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {editErrors.address && <p className="text-red-500 text-xs mt-1">{editErrors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Password (required to update password)
                  </label>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={editForm.currentPassword}
                    onChange={e => handleEditInputChange('currentPassword', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.currentPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {editErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{editErrors.currentPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    placeholder="New Password"
                    value={editForm.newPassword}
                    onChange={e => handleEditInputChange('newPassword', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {editErrors.newPassword && <p className="text-red-500 text-xs mt-1">{editErrors.newPassword}</p>}
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-lg p-6 mb-6 bg-gray-50 dark:bg-gray-800 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Personal Information</h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><span className="font-medium">Email:</span> {userData?.email}</p>
              <p><span className="font-medium">Phone:</span> {userData?.phone}</p>
              <p><span className="font-medium">Address:</span> {userData?.address}</p>
              <p><span className="font-medium">Country:</span> {userData?.country}</p>
            </div>
          </div>

          <div className="rounded-lg p-6 mb-6 bg-gray-50 dark:bg-gray-800 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Pro Seller Status</h3>
            <p
              className={`font-semibold ${
                proStatus === 'approved' ? 'text-green-600' : proStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
              }`}
            >
              {proStatus.charAt(0).toUpperCase() + proStatus.slice(1)} {proStatus !== 'approved' && '(Features inactive until approved)'}
            </p>
            {proStatus === 'standard' && (
              <Link to="/pro-seller-form" className="text-blue-600 hover:underline dark:text-blue-400 mt-2 inline-block">
                Apply for Pro Seller
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" /> My Orders
              </h3>
              <p className="text-gray-600 dark:text-gray-400">View your order history and status.</p>
              <Link to="/orders" className="text-blue-600 hover:underline dark:text-blue-400 mt-2 inline-block">
                View Orders
              </Link>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2" /> Wishlist
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Check your saved items.</p>
              <Link to="/wishlist" className="text-blue-600 hover:underline dark:text-blue-400 mt-2 inline-block">
                View Wishlist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}