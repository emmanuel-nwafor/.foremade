import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { auth } from '/src/firebase';
import AdminSidebar from '../Admin/AdminSidebar';

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
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-2 sm:p-4 md:p-6">
        <div className="max-w-4xl w-full mx-auto py-6 px-2 sm:px-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 text-center md:text-right">Pro Seller Requests</h1>
          {/* Filter UI */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
            <label htmlFor="statusFilter" className="font-medium text-gray-700 dark:text-gray-200">Filter by status:</label>
            <select
              id="statusFilter"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="border rounded px-3 py-1 text-sm dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 sm:p-4">
            {pendingLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : filteredProSellers.length === 0 ? (
              <div className="text-gray-500">No pro sellers found.</div>
            ) : (
              <>
                {/* Table for md+ screens */}
                <div className="hidden md:block w-full overflow-x-auto">
                  <table className="min-w-[600px] w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="px-2 py-2 text-left whitespace-nowrap">ProSeller ID</th>
                        <th className="px-2 py-2 text-left whitespace-nowrap">User ID</th>
                        <th className="px-2 py-2 text-left whitespace-nowrap">Status</th>
                        <th className="px-2 py-2 text-left whitespace-nowrap">Created</th>
                        <th className="px-2 py-2 text-left whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProSellers.map(req => (
                        <tr key={req.proSellerId} className="border-b last:border-b-0">
                          <td className="px-2 py-2 break-all max-w-[120px]">{req.proSellerId}</td>
                          <td className="px-2 py-2 break-all max-w-[120px]">{req.userId}</td>
                          <td className="px-2 py-2 capitalize">{req.status}</td>
                          <td className="px-2 py-2">{formatDate(req.createdAt)}</td>
                          <td className="px-2 py-2 flex flex-col sm:flex-row gap-2">
                            {req.status === 'pending' && (
                              <>
                                <button onClick={() => handleApproveReject(req.proSellerId, true)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 w-full sm:w-auto">Approve</button>
                                <button onClick={() => handleApproveReject(req.proSellerId, false)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 w-full sm:w-auto">Reject</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Cards for small screens */}
                <div className="md:hidden flex flex-col gap-4">
                  {filteredProSellers.map(req => (
                    <div key={req.proSellerId} className="border rounded-lg p-3 shadow-sm bg-gray-50 dark:bg-gray-900">
                      <div className="mb-2 text-xs text-gray-500">ProSeller ID</div>
                      <div className="font-mono text-sm break-all mb-1">{req.proSellerId}</div>
                      <div className="mb-2 text-xs text-gray-500">User ID</div>
                      <div className="font-mono text-sm break-all mb-1">{req.userId}</div>
                      <div className="mb-2 text-xs text-gray-500">Status</div>
                      <div className="text-sm mb-1 capitalize">{req.status}</div>
                      <div className="mb-2 text-xs text-gray-500">Created</div>
                      <div className="text-sm mb-2">{formatDate(req.createdAt)}</div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleApproveReject(req.proSellerId, true)} className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                          <button onClick={() => handleApproveReject(req.proSellerId, false)} className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 