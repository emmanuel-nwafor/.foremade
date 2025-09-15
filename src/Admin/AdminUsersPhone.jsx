import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '/src/firebase';
import AdminSidebar from './AdminSidebar';
import { motion } from 'framer-motion';

export default function AdminUsersPhone() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!auth.currentUser) {
        setError('Please log in as an admin.');
        setLoading(false);
        return;
      }

      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersData = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          const name = data.name || data.username || 'N/A';
          return {
            id: doc.id,
            name,
            email: data.email || 'Not Provided',
            phoneNumber: data.phoneNumber || 'Not Provided',
          };
        });
        setUsers(usersData.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        setError(`Failed to fetch users: ${err.message}`);
        console.error('Fetch users error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Sort by name
  const handleSortByName = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    setUsers([...users].sort((a, b) =>
      newSortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <AdminSidebar />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 ml-0 md:ml-64 p-4 md:p-6 lg:p-8"
        >
          <div className="max-w-8xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 lg:p-10 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <AdminSidebar />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 ml-0 md:ml-64 p-4 md:p-6 lg:p-8"
        >
          <div className="max-w-8xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 lg:p-10 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 ml-0 md:ml-64 p-4 md:p-6 lg:p-8"
      >
        <div className="max-w-8xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-amber-500 mb-6">
            User Details
          </h1>
          <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Security Warning:</strong> Passwords are managed by Firebase Authentication and cannot be accessed or displayed client-side due to security restrictions. To manage user passwords, implement a custom authentication system or password reset endpoint on your Render backend ({import.meta.env.VITE_BACKEND_URL}).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700">
                  <th
                    className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                    onClick={handleSortByName}
                  >
                    Name {sortOrder === 'asc' ? '↑' : '↓'}
                  </th>
                  <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                  <th className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Phone Number</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <td className="p-3 text-sm text-gray-800 dark:text-gray-200">{user.name}</td>
                    <td className="p-3 text-sm text-gray-800 dark:text-gray-200">{user.email}</td>
                    <td className="p-3 text-sm text-gray-800 dark:text-gray-200">{user.phoneNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">No users found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}