import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '/src/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import { History as HistoryIcon } from 'lucide-react';
import debounce from 'lodash.debounce';

function CustomAlert({ alerts, removeAlert }) {
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => alerts.forEach((alert) => removeAlert(alert.id)), 5000);
    return () => clearTimeout(timer);
  }, [alerts, removeAlert]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg shadow-lg ${alert.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white flex items-center gap-2`}
        >
          <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-xl`}></i>
          <span>{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-lg font-bold hover:text-gray-200">✕</button>
        </div>
      ))}
    </div>
  );
}

function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const addAlert = (message, type = 'success') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  };
  const removeAlert = (id) => setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  return { alerts, addAlert, removeAlert };
}

export default function AdminPayoutMonitor() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const navigate = useNavigate();
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

  const handleApprove = async (transactionId, sellerId, amount) => {
    setLoading(true);
    try {
      console.log('Attempting approval for transactionId:', transactionId, 'sellerId:', sellerId, 'amount:', amount);
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://foremade-backend.onrender.com';
      const response = await axios.post(`${BACKEND_URL}/approve-payout`, { transactionId, sellerId, amount }, { timeout: 15000 });
      console.log('Approval response:', response.data);
      if (response.data.status === 'redirect') {
        window.location.href = response.data.redirectUrl; // Handle Stripe onboarding redirect
      } else {
        addAlert(response.data.message || 'Payout approved successfully', 'success');
      }
    } catch (error) {
      console.error('Approval error details:', error.response?.data || error.message);
      let errorMsg = error.response?.data?.error || 'Approval failed. Please check your Paystack balance.';
      const errorDetails = error.response?.data?.details;
      if (errorDetails && typeof errorDetails === 'object') {
        if (errorDetails.pendingBalance !== undefined && errorDetails.amount !== undefined) {
          errorMsg = `Insufficient pending balance: Available ${errorDetails.pendingBalance}, Requested ${errorDetails.amount}`;
        } else {
          errorMsg = Object.entries(errorDetails)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        }
      }
      addAlert(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (transactionId, sellerId) => {
    setLoading(true);
    try {
      console.log('Attempting rejection for transactionId:', transactionId, 'sellerId:', sellerId);
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://foremade-backend.onrender.com';
      const response = await axios.post(`${BACKEND_URL}/reject-payout`, { transactionId, sellerId }, { timeout: 15000 });
      addAlert(response.data.message || 'Payout rejected', 'success');
    } catch (error) {
      console.error('Rejection error details:', error.response?.data || error.message);
      addAlert(error.response?.data?.error || 'Rejection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthChange = (user) => {
      if (!user) {
        addAlert('Please log in.', 'error');
        navigate('/login');
        return;
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged(handleAuthChange);

    if (!auth.currentUser) {
      handleAuthChange(null);
      return;
    }

    const q = query(collection(db, 'transactions'), where('status', '==', 'Pending'), where('type', '==', 'Withdrawal'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const transactionData = [];
      for (const docSnapshot of snapshot.docs) {
        const txn = { id: docSnapshot.id, ...docSnapshot.data() };
        // Ensure critical fields are strings or have fallback values
        txn.id = String(txn.id || 'N/A');
        txn.sellerId = String(txn.sellerId || 'N/A');

        // Validate sellerId before creating document reference
        if (!txn.sellerId || txn.sellerId === 'N/A' || !/^[a-zA-Z0-9]+$/.test(txn.sellerId)) {
          console.warn(`Invalid sellerId for transaction ${txn.id}: ${txn.sellerId}`);
          txn.sellerName = 'Unknown';
          txn.bankName = 'N/A';
          txn.accountNumber = 'N/A';
          transactionData.push(txn);
          continue;
        }

        const sellerRef = doc(db, 'sellers', txn.sellerId);
        try {
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data();
            txn.sellerName = String(sellerData.fullName || 'Unknown');
            txn.accountNumber = String(sellerData.accountNumber || 'N/A');
            if (sellerData.bankCode) {
              const bankRef = doc(db, 'banks', sellerData.bankCode);
              const bankSnap = await getDoc(bankRef);
              txn.bankName = String(bankSnap.exists() ? bankSnap.data().name || 'N/A' : 'N/A');
            } else {
              txn.bankName = 'N/A';
            }
          } else {
            console.warn(`Seller document not found for sellerId: ${txn.sellerId}`);
            txn.sellerName = 'Unknown';
            txn.bankName = 'N/A';
            txn.accountNumber = 'N/A';
          }
        } catch (error) {
          console.error(`Failed to fetch seller or bank data for ${txn.sellerId}:`, error);
          txn.sellerName = 'Unknown';
          txn.bankName = 'N/A';
          txn.accountNumber = 'N/A';
        }
        transactionData.push(txn);
      }
      console.log('Fetched transaction data:', transactionData);
      setTransactions(transactionData);

      // Simplified filtering logic using sellerId
      if (!searchQuery.trim()) {
        setFilteredTransactions(transactionData);
      } else {
        const lowerQuery = searchQuery.toLowerCase().trim();
        setFilteredTransactions(
          transactionData.filter((txn) => {
            const fields = [txn.id, txn.sellerId, txn.sellerName];
            return fields.some((field) => {
              if (!field || typeof field !== 'string') return false;
              return field.toLowerCase() === lowerQuery || field.toLowerCase().includes(lowerQuery);
            });
          })
        );
      }
    }, (error) => {
      addAlert('Failed to fetch transactions.', 'error');
      console.error('Firestore listener error:', error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribe && unsubscribe();
    };
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-amber-500 flex items-center gap-2">
              Admin Payout Monitor
            </h1>
          </div>
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Transaction ID, Seller ID, or Seller Name..."
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
              No pending payout requests.
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
                          <span className="font-medium">Seller Name:</span> {txn.sellerName || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Status:</span>{' '}
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              txn.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : txn.status === 'Approved'
                                ? 'bg-green-100 text-green-800'
                                : txn.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
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
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Bank Name:</span> {txn.bankName || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Account Number:</span> {txn.accountNumber || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Country:</span> {txn.country || 'N/A'}
                        </p>
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
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleApprove(txn.id, txn.sellerId, txn.amount)}
                        disabled={loading || txn.status !== 'Pending' || txn.sellerId === 'N/A'}
                        className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 ${
                          loading || txn.status !== 'Pending' || txn.sellerId === 'N/A' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <i className="bx bx-check"></i>
                        Approve
                      </button>
                      {/* <button
                        onClick={() => handleReject(txn.id, txn.sellerId)}
                        disabled={loading || txn.status !== 'Pending' || txn.sellerId === 'N/A'}
                        className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 ${
                          loading || txn.status !== 'Pending' || txn.sellerId === 'N/A' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <i className="bx bx-x"></i>
                        Reject
                      </button> */}
                    </div>
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