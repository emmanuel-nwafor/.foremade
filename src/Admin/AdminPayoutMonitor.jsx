import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';

const AdminPayoutMonitor = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'transactions'), where('status', '==', 'Pending'));
        const querySnapshot = await getDocs(q);
        const txs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(txs);
        console.log('Fetched transactions:', txs);
      } catch (err) {
        console.error('Fetch transactions error:', err);
        setError('Failed to load transactions: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleApprove = async (transactionId, sellerId) => {
    setLoading(true);
    setError('');
    if (!transactionId || !sellerId) {
      setError('Invalid transaction or seller ID');
      console.error('Invalid data:', { transactionId, sellerId });
      setLoading(false);
      return;
    }
    try {
      console.log('Sending approve request:', { transactionId, sellerId });
      const response = await axios.post(
        'https://foremade-backend.onrender.com/approve-payout',
        { transactionId, sellerId },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('Approve response:', response.data);
      setTransactions(transactions.filter(t => t.id !== transactionId));
      alert('Payout approved');
    } catch (err) {
      console.error('Approval error:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to approve payout: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (transactionId, sellerId) => {
    setLoading(true);
    setError('');
    if (!transactionId || !sellerId) {
      setError('Invalid transaction or seller ID');
      console.error('Invalid data:', { transactionId, sellerId });
      setLoading(false);
      return;
    }
    try {
      console.log('Sending reject request:', { transactionId, sellerId });
      const response = await axios.post(
        'https://foremade-backend.onrender.com/reject-payout',
        { transactionId, sellerId },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('Reject response:', response.data);
      setTransactions(transactions.filter(t => t.id !== transactionId));
      alert('Payout rejected');
    } catch (err) {
      console.error('Reject error:', err.response?.data || err);
      setError(err.response?.data?.error || 'Failed to reject payout: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 lg:w-72 bg-gray-100 transition-all duration-300`}>
          <AdminSidebar />
        </div>
        <div className="flex-1 p-4 sm:p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-200 text-gray-700 rounded-lg"
        onClick={toggleSidebar}
      >
        <i className="bx bx-menu text-xl"></i>
      </button>
      <div className="flex flex-1">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 lg:w-72 bg-gray-100 transition-all duration-300`}>
          <AdminSidebar />
        </div>
        <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-5">
          <div className="max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Admin Payout Monitor</h2>
            {error && (
              <div className="mb-4 p-2 sm:p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="block md:block lg:hidden">
              {transactions.map(t => (
                <div key={t.id} className="border-b p-3 sm:p-4 rounded-lg mb-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                    <span className="text-gray-900 dark:text-gray-100 truncate max-w-[150px] sm:max-w-[200px]">{t.type}</span>
                  </div>
                  <div className="flex justify-between mt-1 text-xs sm:text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Seller ID:</span>
                    <span className="text-gray-900 dark:text-gray-100 truncate max-w-[150px] sm:max-w-[200px]">{t.userId}</span>
                  </div>
                  <div className="flex justify-between mt-1 text-xs sm:text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {t.country === 'Nigeria' ? '₦' : '£'}{t.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1 text-xs sm:text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Reference:</span>
                    <span className="text-gray-900 dark:text-gray-100 truncate max-w-[150px] sm:max-w-[200px]">{t.reference}</span>
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      onClick={() => handleReject(t.id, t.userId)}
                      disabled={loading}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 dark:bg-red-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(t.id, t.userId)}
                      disabled={loading}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 dark:bg-green-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-sm sm:text-base">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">Type</th>
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">Seller ID</th>
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">Amount</th>
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">Reference</th>
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-2 sm:p-3 text-gray-800 dark:text-gray-200 text-sm">{t.type}</td>
                      <td className="p-2 sm:p-3 text-gray-800 dark:text-gray-200 text-sm truncate max-w-[100px] sm:max-w-[150px]">{t.userId}</td>
                      <td className="p-2 sm:p-3 text-gray-800 dark:text-gray-200 text-sm">
                        {t.country === 'Nigeria' ? '₦' : '£'}{t.amount.toFixed(2)}
                      </td>
                      <td className="p-2 sm:p-3 text-gray-800 dark:text-gray-200 text-sm truncate max-w-[150px] sm:max-w-[200px]">{t.reference}</td>
                      <td className="p-2 sm:p-3 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleApprove(t.id, t.userId)}
                          disabled={loading}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 dark:bg-red-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleReject(t.id, t.userId)}
                          disabled={loading}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 dark:bg-green-500 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length === 0 && !error && (
              <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-sm sm:text-base">No pending transactions found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPayoutMonitor;