import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '/src/firebase';
import { query, collection, onSnapshot } from 'firebase/firestore';
import axios from 'axios';
import AdminSidebar from './AdminSidebar'; // Adjust path as needed
import { Wallet as WalletIcon } from 'lucide-react';
import debounce from 'lodash.debounce';

function CustomAlert({ alerts, removeAlert }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-lg shadow-lg flex items-center gap-2 ${
              alert.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            } text-white`}
          >
            <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-xl`}></i>
            <span>{alert.message}</span>
            <button
              onClick={() => removeAlert(alert.id)}
              className="ml-auto text-lg font-bold hover:text-gray-200"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const addAlert = useCallback((message, type = 'success') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setAlerts((prev) => prev.filter((alert) => alert.id !== id)), 5000);
  }, []);
  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);
  return { alerts, addAlert, removeAlert };
}

export default function AdminPayoutMonitor() {
  const navigate = useNavigate();
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleApprove = async (transactionId, sellerId) => {
    if (!transactionId || !sellerId) {
      addAlert('Cannot approve: Missing transaction or seller ID', 'error');
      return;
    }
    setLoading(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(
        `${BACKEND_URL}/approve-payout`,
        { transactionId, sellerId },
        { timeout: 15000 }
      );
      addAlert(response.data.message);
    } catch (error) {
      console.error('Approve error:', error.message, { transactionId, sellerId, details: error.response?.data?.details });
      const errorMessage = error.response?.data?.error || error.message;
      const errorDetails = error.response?.data?.details ? JSON.stringify(error.response.data.details) : '';
      addAlert(`Failed to approve payout: ${errorMessage}${errorDetails ? ` (Details: ${errorDetails})` : ''}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (transactionId, sellerId) => {
    if (!transactionId || !sellerId) {
      addAlert('Cannot reject: Missing transaction or seller ID', 'error');
      return;
    }
    setLoading(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(
        `${BACKEND_URL}/reject-payout`,
        { transactionId, sellerId },
        { timeout: 15000 }
      );
      addAlert(response.data.message);
    } catch (error) {
      console.error('Reject error:', error.message, { transactionId, sellerId, details: error.response?.data?.details });
      const errorMessage = error.response?.data?.error || error.message;
      const errorDetails = error.response?.data?.details ? JSON.stringify(error.response.data.details) : '';
      addAlert(`Failed to reject payout: ${errorMessage}${errorDetails ? ` (Details: ${errorDetails})` : ''}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) {
      addAlert('Please log in.', 'error');
      navigate('/login');
      return;
    }

    const q = query(collection(db, 'transactions'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const transactionData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Fetched transactions:', transactionData); // Debug log
        setTransactions(transactionData);
        setFilteredTransactions(
          transactionData.filter(
            (txn) =>
              (txn.id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
              (txn.sellerId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
              (txn.type?.toLowerCase() || '').includes(searchQuery.toLowerCase())
          )
        );
      },
      (error) => {
        console.error('Firestore error:', error.message);
        addAlert(`Failed to fetch transactions: ${error.message}`, 'error');
      }
    );

    return () => unsubscribe();
  }, [navigate, searchQuery]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 ml-0 md:ml-64 p-4 md:p-6 lg:p-8"
      >
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 flex items-center gap-2">
              <WalletIcon className="w-8 h-8" />
              Payout Monitor
            </h2>
          </div>
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Transaction ID, Seller ID, or Type..."
                onChange={handleSearchChange}
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
            </div>
          </div>
          {filteredTransactions.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-gray-600 dark:text-gray-400 text-center py-8"
            >
              No transactions found.
            </motion.p>
          ) : (
            <motion.div className="grid gap-4 lg:grid-cols-2">
              <AnimatePresence>
                {filteredTransactions.map((txn, index) => (
                  <motion.div
                    key={txn.id || `txn-${index}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Transaction ID:</span> {txn.id || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Seller ID:</span> {txn.sellerId || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Type:</span> {txn.type || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Status:</span>{' '}
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              txn.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : txn.status === 'Approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {txn.status || 'N/A'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Amount:</span>{' '}
                          {txn.country === 'United Kingdom' ? '£' : '₦'}
                          {txn.amount?.toFixed(2) || '0.00'}
                        </p>
                        {txn.type === 'Withdrawal' && (
                          <>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Bank:</span> {txn.bankName || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Account:</span> {txn.accountNumber || 'N/A'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      <span className="font-medium">Date:</span>{' '}
                      {txn.createdAt?.toDate ? new Date(txn.createdAt.toDate()).toLocaleString() : 'N/A'}
                    </p>
                    {txn.status === 'Failed' && txn.failureReason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        <span className="font-medium">Reason:</span> {txn.failureReason}
                      </p>
                    )}
                    {txn.status === 'Pending' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => handleApprove(txn.id, txn.sellerId)}
                          disabled={loading || !txn.id || !txn.sellerId}
                          className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 ${
                            loading || !txn.id || !txn.sellerId ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <i className="bx bx-check"></i>
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(txn.id, txn.sellerId)}
                          disabled={loading || !txn.id || !txn.sellerId}
                          className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 ${
                            loading || !txn.id || !txn.sellerId ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <i className="bx bx-x"></i>
                          Reject
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </motion.div>
    </div>
  );
}