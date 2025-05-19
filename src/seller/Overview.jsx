import React, { useState, useEffect } from 'react';
import SellerSidebar from './SellerSidebar';
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
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-1">
        <div className="hidden md:block md:w-1/4 p-6">
          <SellerSidebar />
        </div>
        <div className="w-full p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-700">Welcome {vendor.displayName || 'Vendor'}</h1>
            <p className="text-sm text-gray-500">Monitor your business analytics and statistics.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-gray-400">pending</p>
              <p className="text-lg font-semibold text-gray-800">{mockStats.pending}</p>
            </div>
            <div className="rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-green-500">confirmed</p>
              <p className="text-lg font-semibold text-gray-800">{mockStats.confirmed}</p>
            </div>
            <div className="rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-gray-400">packaging</p>
              <p className="text-lg font-semibold text-gray-800">{mockStats.packaging}</p>
            </div>
            <div className="rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-blue-500">out for delivery</p>
              <p className="text-lg font-semibold text-gray-800">{mockStats.outForDelivery}</p>
            </div>
            <div className="rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-green-500">delivered</p>
              <p className="text-lg font-semibold text-gray-800">{mockStats.delivered}</p>
            </div>
            <div className="rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-red-500">canceled</p>
              <p className="text-lg font-semibold text-gray-800">{mockStats.canceled}</p>
            </div>
            <div className="rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-yellow-500">returned</p>
              <p className="text-lg font-semibold text-gray-800">{mockStats.returned}</p>
            </div>
            <div className="rounded-lg p-4 bg-gray-50 text-center">
              <p className="text-red-500">failed to delivery</p>
              <p className="text-lg font-semibold text-gray-800">{mockStats.failedToDelivery}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Link to="/vendor/products" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200">
              Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}