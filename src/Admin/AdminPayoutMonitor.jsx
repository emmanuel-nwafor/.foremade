import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';

const AdminPayoutMonitor = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    // Fetch pending withdrawal payouts
    const q = query(
      collection(db, 'transactions'),
      where('type', '==', 'Withdrawal'),
      where('status', '==', 'Pending')
    );
    const unsubscribePayouts = onSnapshot(q, (snapshot) => {
      const payoutList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayouts(payoutList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching payouts:', error);
      setErrorMessage('Failed to load pending payouts.');
      setLoading(false);
    });

    return () => unsubscribePayouts();
  }, []);

  const approvePayout = async (payout) => {
    setActionLoading(prev => ({ ...prev, [payout.id]: 'approve' }));
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/approve-payout`, {
        transactionId: payout.id,
        sellerId: payout.userId,
      });

      if (response.data.status === 'redirect') {
        window.location.href = response.data.redirectUrl;
        return;
      }

      setSuccessMessage(`Payout of ₦${payout.amount.toLocaleString()} to seller ${payout.userId} approved and transferred.`);
    } catch (error) {
      setErrorMessage(`Failed to approve payout: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [payout.id]: null }));
    }
  };

  const rejectPayout = async (payout) => {
    setActionLoading(prev => ({ ...prev, [payout.id]: 'reject' }));
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/reject-payout`, {
        transactionId: payout.id,
        sellerId: payout.userId,
      });
      setSuccessMessage(`Payout of ₦${payout.amount.toLocaleString()} to seller ${payout.userId} rejected. Funds returned.`);
    } catch (error) {
      setErrorMessage(`Failed to reject payout: ${error.response?.data?.error || error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [payout.id]: null }));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-1">
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-200 text-gray-700 rounded-lg dark:bg-gray-700 dark:text-gray-200"
          onClick={toggleSidebar}
        >
          <i className="bx bx-menu text-xl"></i>
        </button>

        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-56 lg:w-72 bg-gray-100 dark:bg-gray-800 transition-all duration-300 fixed md:static h-full z-40`}>
          <AdminSidebar />
        </div>

        <div className="flex-1 p-4 sm:p-6 md:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Pending Payout Approvals</h2>
            {successMessage && (
              <p className="text-green-600 text-[10px] sm:text-xs mb-4 dark:text-green-400">{successMessage}</p>
            )}
            {errorMessage && (
              <p className="text-red-600 text-[10px] sm:text-xs mb-4 dark:text-red-400">{errorMessage}</p>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                      <th className="py-2 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-600">Seller ID</th>
                      <th className="py-2 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-600">Amount (₦)</th>
                      <th className="py-2 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-600">Description</th>
                      <th className="py-2 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-600">Status</th>
                      <th className="py-2 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">{payout.userId}</td>
                        <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">{payout.amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</td>
                        <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">{payout.description}</td>
                        <td className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">{payout.status}</td>
                        <td className="py-2 px-4 flex gap-2">
                          <button
                            onClick={() => approvePayout(payout)}
                            disabled={actionLoading[payout.id] === 'approve'}
                            className={`bg-green-500 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm rounded flex items-center gap-1 ${
                              actionLoading[payout.id] === 'approve' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
                            }`}
                          >
                            {actionLoading[payout.id] === 'approve' ? (
                              'Processing...'
                            ) : (
                              <>
                                Approve <i className="bx bx-check text-base"></i>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => rejectPayout(payout)}
                            disabled={actionLoading[payout.id] === 'reject'}
                            className={`bg-red-500 text-white px-2 sm:px-3 py-1 text-xs sm:text-sm rounded flex items-center gap-1 ${
                              actionLoading[payout.id] === 'reject' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                            }`}
                          >
                            {actionLoading[payout.id] === 'reject' ? (
                              'Processing...'
                            ) : (
                              <>
                                Reject <i className="bx bx-x text-base"></i>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Cards */}
              <div className="block sm:hidden">
                {payouts.map((payout) => (
                  <div key={payout.id} className="border-b dark:border-gray-600 p-4 bg-white dark:bg-gray-800">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Seller ID:</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{payout.userId}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{payout.amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Description:</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{payout.description}</span>
                    </div> 
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Status:</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{payout.status}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => approvePayout(payout)}
                        disabled={actionLoading[payout.id] === 'approve'}
                        className={`flex-1 bg-green-500 text-white px-2 py-1 text-xs rounded flex items-center justify-center gap-1 ${
                          actionLoading[payout.id] === 'approve' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
                        }`}
                      >
                        {actionLoading[payout.id] === 'approve' ? (
                          'Processing...'
                        ) : (
                          <>
                            Approve <i className="bx bx-check text-sm"></i>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => rejectPayout(payout)}
                        disabled={actionLoading[payout.id] === 'reject'}
                        className={`flex-1 bg-red-500 text-white px-2 py-1 text-xs rounded flex items-center justify-center gap-1 ${
                          actionLoading[payout.id] === 'reject' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                        }`}
                      >
                        {actionLoading[payout.id] === 'reject' ? (
                          'Processing...'
                        ) : (
                          <>
                            Reject <i className="bx bx-x text-sm"></i>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {payouts.length === 0 && (
                <p className="text-center p-4 text-sm text-gray-600 dark:text-gray-400">No pending payouts found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayoutMonitor;