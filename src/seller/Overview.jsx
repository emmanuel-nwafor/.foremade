import React, { useState, useEffect } from 'react';
import { vendorAuth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function Overview() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock stats for the dashboard
  const mockStats = {
    pending: 0,
    confirmed: 0,
    delivered: 0,
    canceled: 0,
    packaging: 0,
    outForDelivery: 0,
    returned: 0,
    failedToDelivery: 0,
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      vendorAuth,
      (user) => {
        if (user) {
          setVendor(user);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-600"></div>
        <p className="text-gray-600 mt-2">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-600 text-[10px] mb-4">{error}</p>
          <p className="text-gray-600">
            <Link to="/seller/login" className="text-blue-600 hover:underline">
              Return to Login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 px-4">
      <h1 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">Welcome {vendor.displayName || 'Vendor'}</h1>
      <p className="text-xs md:text-sm text-gray-500 mb-4">Monitor your business analytics and statistics.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-6">
        <div className="rounded-lg p-3 bg-gray-50 text-center">
          <p className="text-xs md:text-sm text-gray-400">pending</p>
          <p className="text-base md:text-lg font-semibold text-gray-800">{mockStats.pending}</p>
        </div>
        <div className="rounded-lg p-3 bg-gray-50 text-center">
          <p className="text-xs md:text-sm text-green-500">confirmed</p>
          <p className="text-base md:text-lg font-semibold text-gray-800">{mockStats.confirmed}</p>
        </div>
        <div className="rounded-lg p-3 bg-gray-50 text-center">
          <p className="text-xs md:text-sm text-gray-400">packaging</p>
          <p className="text-base md:text-lg font-semibold text-gray-800">{mockStats.packaging}</p>
        </div>
        <div className="rounded-lg p-3 bg-gray-50 text-center">
          <p className="text-xs md:text-sm text-blue-500">out for delivery</p>
          <p className="text-base md:text-lg font-semibold text-gray-800">{mockStats.outForDelivery}</p>
        </div>
        <div className="rounded-lg p-3 bg-gray-50 text-center">
          <p className="text-xs md:text-sm text-green-500">delivered</p>
          <p className="text-base md:text-lg font-semibold text-gray-800">{mockStats.delivered}</p>
        </div>
        <div className="rounded-lg p-3 bg-gray-50 text-center">
          <p className="text-xs md:text-sm text-red-500">canceled</p>
          <p className="text-base md:text-lg font-semibold text-gray-800">{mockStats.canceled}</p>
        </div>
        <div className="rounded-lg p-3 bg-gray-50 text-center">
          <p className="text-xs md:text-sm text-yellow-500">returned</p>
          <p className="text-base md:text-lg font-semibold text-gray-800">{mockStats.returned}</p>
        </div>
        <div className="rounded-lg p-3 bg-gray-50 text-center">
          <p className="text-xs md:text-sm text-red-500">failed to delivery</p>
          <p className="text-base md:text-lg font-semibold text-gray-800">{mockStats.failedToDelivery}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Link to="/vendor/products" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 text-sm md:text-base">
          Products
        </Link>
      </div>
    </div>
  );
}