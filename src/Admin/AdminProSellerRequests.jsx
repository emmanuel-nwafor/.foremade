import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { auth } from '/src/firebase';
import AdminSidebar from './AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminProSellerRequests() {
  const [allProSellers, setAllProSellers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Fetch pro seller requests from backend API
  const fetchProSellers = async () => {
    setPendingLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const idToken = await user.getIdToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/admin/all-pro-sellers`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAllProSellers(data.proSellers || []);
      } else {
        toast.error(data.message || 'Failed to fetch pro seller requests');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch pro seller requests');
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    fetchProSellers();
  }, []);

  // Approve or reject a pro seller request
  const handleApproveReject = async (proSellerId, approve) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const idToken = await user.getIdToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/admin/approve-pro-seller`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proSellerId, approve }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        toast.success(data.message || (approve ? 'Pro seller approved' : 'Pro seller rejected'));
        fetchProSellers();
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Helper to format date safely
  const formatDate = (dateObj) => {
    if (!dateObj) return '-';
    // Support Firestore Timestamp object or ISO string
    if (typeof dateObj === 'object' && dateObj.seconds) {
      const d = new Date(dateObj.seconds * 1000);
      return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
    }
    const d = new Date(dateObj);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  };

  const filteredProSellers = filter === 'all'
    ? allProSellers
    : allProSellers.filter(req => req.status === filter);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <motion.main
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 ml-0 md:ml-64 p-4 md:p-6 lg:p-8"
      >
        <div className="max-w-8xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-amber-500 flex items-center gap-2">
              Pro Seller Requests
            </h1>
          </div>
          {/* Filter UI */}
          <div className="mb-6">
            <div className="relative">
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Filter by status:
              </label>
              <select
                id="statusFilter"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            {pendingLoading ? (
              <div className="text-gray-500 text-center py-8">Loading...</div>
            ) : filteredProSellers.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No pro sellers found.</div>
            ) : (
              <motion.table
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md"
              >
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">ProSeller ID</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">User ID</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Created</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredProSellers.map((req, index) => (
                      <motion.tr
                        key={req.proSellerId || `req-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-3 break-all max-w-xs">{req.proSellerId}</td>
                        <td className="px-4 py-3 break-all max-w-xs">{req.userId}</td>
                        <td className="px-4 py-3 capitalize">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            req.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                            : req.status === 'approved' ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatDate(req.createdAt)}</td>
                        <td className="px-4 py-3 flex gap-2">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveReject(req.proSellerId, true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproveReject(req.proSellerId, false)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </motion.table>
            )}
          </div>
        </div>
      </motion.main>
    </div>
  );
}