import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import SellerSidebar from './SellerSidebar';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    console.log('Dashboard component mounted');
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (!user) {
        setError('Please log in to view your dashboard.');
      }
      setLoading(false);
    });

    return () => {
      console.log('Dashboard component unmounting');
      unsubscribeAuth();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
          <Link to="/login" className="text-blue-600 hover:underline mt-2 inline-block">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-800 text-white rounded-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <i className="bx bx-menu text-xl"></i>
      </button>

      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 bg-white border-r`}>
        <SellerSidebar />
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Overview</h1>
          <div className="bg-white rounded-xl p-6">
            <p className="text-gray-600">Welcome to your dashboard!</p>
          </div>
        </div>
      </div>
    </div>
  );
}