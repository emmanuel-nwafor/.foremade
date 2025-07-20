import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '/src/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';

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
  const addAlert = (message, type = 'success') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setAlerts((prev) => prev.filter((alert) => alert.id !== id)), 5000);
  };
  const removeAlert = (id) => setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  return { alerts, addAlert, removeAlert };
}

export default function AdminPayoutMonitor() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

    // Fetch OTP status
    const adminRef = doc(db, 'admin', 'settings');
    getDoc(adminRef).then((snap) => {
      if (snap.exists()) {
        setOtpEnabled(snap.data().otpEnabled !== false);
      }
    });

    // Fetch transactions
    const q = query(
      collection(db, 'transactions'),
      where('type', '==', 'Withdrawal'),
      where('status', '==', 'Pending')
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const transactionData = [];
      for (const docSnapshot of snapshot.docs) {
        const txn = { id: docSnapshot.id, ...docSnapshot.data() };
        const sellerRef = doc(db, 'sellers', txn.sellerId);
        try {
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data();
            txn.sellerName = sellerData.fullName || 'Unknown';
            txn.accountNumber = sellerData.accountNumber || 'N/A';
            if (sellerData.bankCode) {
              const bankRef = doc(db, 'banks', sellerData.bankCode);
              const bankSnap = await getDoc(bankRef);
              txn.bankName = bankSnap.exists() ? bankSnap.data().name || 'N/A' : 'N/A';
            } else {
              txn.bankName = 'N/A';
            }
          } else {
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
      setTransactions(transactionData);
      setFilteredTransactions(transactionData);
    }, (error) => {
      addAlert('Failed to fetch transactions.', 'error');
      console.error('Firestore listener error:', error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribe && unsubscribe();
    };
  }, [navigate, addAlert]);

  useEffect(() => {
    // Filter transactions based on search query
    setFilteredTransactions(
      transactions.filter(
        (txn) =>
          txn.sellerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          txn.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, transactions]);

  const handleToggleOtp = async () => {
    setLoading(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${BACKEND_URL}/toggle-otp`, { otpEnabled: !otpEnabled });
      setOtpEnabled(!otpEnabled);
      addAlert(response.data.message, 'success');
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to toggle OTP', 'error');
      console.error('Toggle OTP error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId, sellerId, amount) => {
    setLoading(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${BACKEND_URL}/approve-payout`, { transactionId, sellerId });
      addAlert(response.data.message, 'success');
    } catch (error) {
      const errorMsg = error.response?.data?.details || 'Approval failed. Please check your Paystack balance.';
      addAlert(errorMsg, 'error');
      console.error('Approval error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (transactionId, sellerId) => {
    setLoading(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${BACKEND_URL}/reject-payout`, { transactionId, sellerId });
      addAlert(response.data.message, 'success');
    } catch (error) {
      addAlert(error.response?.data?.error || 'Rejection failed', 'error');
      console.error('Rejection error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <AdminSidebar />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 ml-0 md:ml-64 p-4 md:p-6"
      >
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 flex items-center gap-2">
              <i className="bx bx-wallet text-4xl"></i>
              Payout Dashboard
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  OTP for Transfers:
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={otpEnabled}
                    onChange={handleToggleOtp}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-400 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                    {otpEnabled ? 'On' : 'Off'}
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Seller ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            <motion.div className="grid gap-4">
              <AnimatePresence>
                {filteredTransactions.map((txn, index) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Transaction ID:</span> {txn.id}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Seller ID:</span> {txn.sellerId}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Seller Name:</span> {txn.sellerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Bank:</span> {txn.bankName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Account:</span> {txn.accountNumber}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Amount:</span>{' '}
                          {txn.country === 'United Kingdom' ? '£' : '₦'}
                          {txn.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      <span className="font-medium">Date:</span>{' '}
                      {new Date(txn.createdAt?.toDate()).toLocaleString()}
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
                        {txn.status}
                      </span>
                    </p>
                    <div className="mt-4 flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 8px rgba(0, 255, 0, 0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApprove(txn.id, txn.sellerId, txn.amount)}
                        className={`flex items-center gap-2 py-2 px-4 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={loading}
                      >
                        <i className="bx bx-check"></i>
                        Approve
                        {loading && (
                          <i className="bx bx-loader-alt animate-spin"></i>
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 8px rgba(255, 0, 0, 0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReject(txn.id, txn.sellerId)}
                        className={`flex items-center gap-2 py-2 px-4 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={loading}
                      >
                        <i className="bx bx-x"></i>
                        Reject
                        {loading && (
                          <i className="bx bx-loader-alt animate-spin"></i>
                        )}
                      </motion.button>
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