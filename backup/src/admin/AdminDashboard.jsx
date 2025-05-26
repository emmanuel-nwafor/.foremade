import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { collection, getDocs } from 'firebase/firestore';
import AdminSidebar from '/src/admin/AdminSidebar';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, admins: 0, vendors: 0, products: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, adminsSnap, vendorsSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'admins')),
          getDocs(collection(db, 'vendors')),
          getDocs(collection(db, 'products')),
        ]);

        setStats({
          users: usersSnap.size,
          admins: adminsSnap.size,
          vendors: vendorsSnap.size,
          products: productsSnap.size,
        });
      } catch (err) {
        setError('Failed to fetch dashboard stats: ' + err.message);
      }
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg dark:bg-red-900 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">Admin Dashboard</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-100 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-700">Total Users</h2>
              <p className="text-2xl font-bold text-blue-600">{stats.users}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-700">Total Admins</h2>
              <p className="text-2xl font-bold text-green-600">{stats.admins}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-700">Total Vendors</h2>
              <p className="text-2xl font-bold text-yellow-600">{stats.vendors}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-700">Total Products</h2>
              <p className="text-2xl font-bold text-red-600">{stats.products}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}