import React, { useState, useEffect } from 'react';
import SellerSidebar from './SellerSidebar';
import { vendorAuth } from '../firebase';
import { onAuthStateChanged, updateProfile, updatePassword } from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function Overview() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
  });

  // Fetch vendor auth details
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      vendorAuth,
      (user) => {
        if (user) {
          setVendor(user);
          setFormData({
            name: user.displayName || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            password: '',
          });
        } else {
          setError('Please log in to view your profile.');
        }
        setLoading(false);
      },
      (err) => {
        setError('Authentication error: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle profile update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const user = vendorAuth.currentUser;
      if (!user) throw new Error('User not authenticated.');

      // Update displayName
      if (formData.name !== user.displayName) {
        await updateProfile(user, { displayName: formData.name });
      }

      // Update password
      if (formData.password) {
        await updatePassword(user, formData.password);
      }

      setVendor({ ...user, displayName: formData.name });
      setEditMode(false);
      setFormData((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setError('');
    setFormData((prev) => ({ ...prev, password: '' }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SellerSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6 font-serif">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SellerSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6 font-serif">
          <div className="max-w-5xl mx-auto bg-red-100 border-l-4 border-red-500 p-4 rounded-lg animate-fade-in">
            <p className="text-red-700">{error}</p>
            <p className="mt-2">
              <Link to="/seller/login" className="text-blue-600 hover:underline">
                Return to Login
              </Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SellerSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 font-serif">
        <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Vendor Profile</h1>
            <button
              onClick={toggleEditMode}
              className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-2 rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-300 transform hover:scale-105"
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editMode ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="peer w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-300"
                  required
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 text-sm text-gray-600 bg-white px-1 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600">
                  Full Name
                </label>
              </div>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  disabled
                />
                <label className="absolute left-3 -top-2.5 text-sm text-gray-600 bg-white px-1">
                  Email
                </label>
              </div>
              <div className="relative">
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="peer w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-300"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 text-sm text-gray-600 bg-white px-1 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600">
                  Phone Number
                </label>
                <p className="text-xs text-gray-500 mt-1">Phone updates require SMS verification. Contact support.</p>
              </div>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="peer w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all duration-300"
                  placeholder=" "
                />
                <label className="absolute left-3 -top-2.5 text-sm text-gray-600 bg-white px-1 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600">
                  New Password
                </label>
              </div>
              <div className="text-right">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-2 rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-300 transform hover:scale-105"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* <div className="border-b border-gray-200 pb-4">
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-base font-medium">{vendor.displayName || 'N/A'}</p>
              </div> */}
              <div className="border-b border-gray-200 pb-4">
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-base font-medium">{vendor.email || 'N/A'}</p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="text-base font-medium">{vendor.phoneNumber || 'N/A'}</p>
              </div>
              <div className="border-b border-gray-200 pb-4">
                <p className="text-sm text-gray-600">Password</p>
                <p className="text-base font-medium">********</p>
              </div>
              <div className="col-span-1 md:col-span-2 mt-4">
                <Link to="/seller/agreement" className="text-blue-600 text-xs hover:underline">
                  View Vendor User Agreement
                </Link>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-6 bg-red-100 border-l-4 border-red-500 p-4 rounded-lg animate-fade-in">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}