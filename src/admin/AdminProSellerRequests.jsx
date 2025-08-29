import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AdminSidebar from './AdminSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AdminProSellerRequests() {
  const [allProSellers, setAllProSellers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchProSellers = async () => {
    setPendingLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/admin/all-pro-sellers`);
      console.log('Response status:', res.status, 'Headers:', Object.fromEntries(res.headers.entries()));
      const data = await res.json();
      console.log('Response data:', data);
      if (res.ok && data.status === 'success') {
        setAllProSellers(data.proSellers || []);
      } else {
        toast.error(data.message || 'Failed to fetch pro seller requests');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error(err.message || 'Failed to fetch pro seller requests');
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    fetchProSellers();
  }, []);

  const handleApproveReject = async (proSellerId, approve) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/admin/approve-pro-seller`, {
        method: 'POST',
        headers: {
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
      console.error('Approve/Reject error:', err);
      toast.error(err.message || 'Action failed');
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return '-';
    if (typeof dateObj === 'object' && dateObj.seconds) {
      const d = new Date(dateObj.seconds * 1000);
      return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
    }
    const d = new Date(dateObj);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  };

  const filteredProSellers = allProSellers.filter(req =>
    (req.proSellerId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (req.userId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (req.status?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  ).filter(req => filter === 'all' || req.status === filter);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4 sm:p-6">
        <div className="w-full max-w-8xl mx-auto p-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-amber-500 flex items-center gap-2">
            <i className="bx bx-store text-blue-500 text-lg sm:text-xl"></i>
            Pro Seller Requests
          </h2>

          {/* Search and Filter */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                Search Pro Sellers
                <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help text-xs sm:text-sm" title="Search by ID, User ID, or Status"></i>
              </label>
              <div className="relative">
                <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, User ID, or Status..."
                  className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
              </div>
            </div>
            <div className="relative group">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                Filter by Status
                <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help text-xs sm:text-sm" title="Filter pro seller requests"></i>
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Pro Sellers Table/Grid */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 sm:mb-4 flex items-center gap-2">
              <i className="bx bx-list-ul text-blue-500 text-lg sm:text-xl"></i>
              All Pro Sellers
            </h3>
            {pendingLoading ? (
              <div className="text-gray-500 text-center py-8">Loading...</div>
            ) : filteredProSellers.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No pro sellers found.</div>
            ) : (
              <>
                {/* Table for desktop/large screens */}
                <div className="hidden lg:block">
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
                        {filteredProSellers.map((req, index) => {
                          const statusColor = req.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : req.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
                          return (
                            <motion.tr
                              key={req.proSellerId || `req-${index}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <td className="px-4 py-3 break-all max-w-xs cursor-pointer text-blue-600 hover:underline" onClick={() => navigate(`/admin/pro-seller-details/${req.proSellerId}`)}>{req.proSellerId}</td>
                              <td className="px-4 py-3 break-all max-w-xs">{req.userId}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">{formatDate(req.createdAt)}</td>
                              <td className="px-4 py-3 flex gap-2">
                                {req.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveReject(req.proSellerId, true)}
                                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition flex items-center gap-1"
                                    >
                                      <i className="bx bx-check"></i> Approve
                                    </button>
                                    <button
                                      onClick={() => handleApproveReject(req.proSellerId, false)}
                                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition flex items-center gap-1"
                                    >
                                      <i className="bx bx-x"></i> Reject
                                    </button>
                                  </>
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </motion.table>
                </div>

                {/* Grid for mobile/tablet screens */}
                <div className="lg:hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {filteredProSellers.map((req, index) => {
                        const statusColor = req.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          : req.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
                        return (
                          <motion.div
                            key={req.proSellerId || `req-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-col gap-3 mb-3">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate cursor-pointer text-blue-600 hover:underline" onClick={() => navigate(`/admin/pro-seller-details/${req.proSellerId}`)}>ProSeller ID: {req.proSellerId}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">User ID: {req.userId}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
                                {req.status}
                              </span>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Created: {formatDate(req.createdAt)}</p>
                            </div>
                            {req.status === 'pending' && (
                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  onClick={() => handleApproveReject(req.proSellerId, true)}
                                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition flex items-center gap-1"
                                >
                                  <i className="bx bx-check"></i> Approve
                                </button>
                                <button
                                  onClick={() => handleApproveReject(req.proSellerId, false)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition flex items-center gap-1"
                                >
                                  <i className="bx bx-x"></i> Reject
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}