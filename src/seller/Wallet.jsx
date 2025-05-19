import React, { useState, useEffect } from 'react';
import { vendorAuth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function Wallet() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock wallet data
  const mockWallet = {
    balance: 0.00,
    pendingWithdraw: 0.00,
    totalCommissionGiven: 0.00,
    totalDeliveryChargeEarned: 0.00,
    alreadyWithdrawn: 0.00,
    totalTaxGiven: 0.00,
    collectedCash: 0.00,
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      vendorAuth,
      (user) => {
        if (user) {
          setVendor(user);
        } else {
          setError('Please log in to view your wallet.');
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
    <div className="px-4 py-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-lg md:text-xl font-semibold text-gray-700 flex items-center">
          <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM1 10a9 9 0 1118 0 9 9 0 01-18 0z" clipRule="evenodd" />
          </svg>
          Vendor Wallet
        </h1>
      </div>

      {/* Main Balance Card */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <div className="flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6zM8 6a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
          </svg>
          <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">₦{mockWallet.balance.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Withdrawable Balance</p>
          <Link
            to="/vendor/withdraw"
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 text-sm md:text-base w-full text-center"
          >
            Withdraw
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-md text-center">
          <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM1 10a9 9 0 1118 0 9 9 0 01-18 0z" clipRule="evenodd" />
          </svg>
          <p className="text-xl md:text-2xl font-semibold text-gray-800">₦{mockWallet.pendingWithdraw.toFixed(2)}</p>
          <p className="text-xs md:text-sm text-gray-600">Pending Withdraw</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md text-center">
          <svg className="w-8 h-8 mx-auto text-yellow-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM1 10a9 9 0 1118 0 9 9 0 01-18 0z" clipRule="evenodd" />
          </svg>
          <p className="text-xl md:text-2xl font-semibold text-gray-800">₦{mockWallet.totalCommissionGiven.toFixed(2)}</p>
          <p className="text-xs md:text-sm text-gray-600">Total Commission Given</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md text-center">
          <svg className="w-8 h-8 mx-auto text-green-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM1 10a9 9 0 1118 0 9 9 0 01-18 0z" clipRule="evenodd" />
          </svg>
          <p className="text-xl md:text-2xl font-semibold text-gray-800">₦{mockWallet.totalDeliveryChargeEarned.toFixed(2)}</p>
          <p className="text-xs md:text-sm text-gray-600">Total Delivery Charge Earned</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md text-center">
          <svg className="w-8 h-8 mx-auto text-blue-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM1 10a9 9 0 1118 0 9 9 0 01-18 0z" clipRule="evenodd" />
          </svg>
          <p className="text-xl md:text-2xl font-semibold text-gray-800">₦{mockWallet.alreadyWithdrawn.toFixed(2)}</p>
          <p className="text-xs md:text-sm text-gray-600">Already Withdrawn</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md text-center">
          <svg className="w-8 h-8 mx-auto text-red-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM1 10a9 9 0 1118 0 9 9 0 01-18 0z" clipRule="evenodd" />
          </svg>
          <p className="text-xl md:text-2xl font-semibold text-gray-800">₦{mockWallet.totalTaxGiven.toFixed(2)}</p>
          <p className="text-xs md:text-sm text-gray-600">Total Tax Given</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md text-center">
          <svg className="w-8 h-8 mx-auto text-orange-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM1 10a9 9 0 1118 0 9 9 0 01-18 0z" clipRule="evenodd" />
          </svg>
          <p className="text-xl md:text-2xl font-semibold text-gray-800">₦{mockWallet.collectedCash.toFixed(2)}</p>
          <p className="text-xs md:text-sm text-gray-600">Collected Cash</p>
        </div>
      </div>
    </div>
  );
}