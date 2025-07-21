import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '/src/firebase';
import { query, collection, onSnapshot, where, getDoc, doc } from 'firebase/firestore';
import axios from 'axios';
import AdminSidebar from './AdminSidebar'; // Adjust path as needed
import { Wallet as WalletIcon, X as CloseIcon, Trash2 } from 'lucide-react';
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

function SellerDetailsModal({ isOpen, onClose, sellerId }) {
  const [sellerData, setSellerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !sellerId) return;

    const fetchSellerData = async () => {
      setLoading(true);
      try {
        const sellerRef = doc(db, 'sellers', sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          setSellerData(sellerSnap.data());
        } else {
          setError('Seller not found');
        }
      } catch (err) {
        console.error('Seller fetch error:', err.message, { sellerId });
        setError('Failed to fetch seller details');
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Seller Details</h3>
              <button onClick={onClose} className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            {loading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            ) : error ? (
              <p className="text-red-600 dark:text-red-400">{error}</p>
            ) : sellerData ? (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p><span className="font-medium">Seller ID:</span> {sellerData.sellerId || 'N/A'}</p>
                <p><span className="font-medium">Full Name:</span> {sellerData.fullName || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {sellerData.email || 'N/A'}</p>
                <p><span className="font-medium">Country:</span> {sellerData.country || 'N/A'}</p>
                <p><span className="font-medium">Bank Name:</span> {sellerData.bankName || 'N/A'}</p>
                <p><span className="font-medium">Account Number:</span> {sellerData.accountNumber || 'N/A'}</p>
                {sellerData.country === 'Nigeria' && (
                  <p><span className="font-medium">Paystack Recipient Code:</span> {sellerData.paystackRecipientCode || 'N/A'}</p>
                )}
                {sellerData.country === 'United Kingdom' && (
                  <>
                    <p><span className="font-medium">IBAN:</span> {sellerData.iban || 'N/A'}</p>
                    <p><span className="font-medium">Stripe Account ID:</span> {sellerData.stripeAccountId || 'N/A'}</p>
                  </>
                )}
                <p><span className="font-medium">Created At:</span> {sellerData.createdAt ? new Date(sellerData.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState(null);

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

  const handleDelete = async (transactionId) => {
    if (!transactionId) {
      addAlert('Cannot delete: Missing transaction ID', 'error');
      return;
    }
    setLoading(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(
        `${BACKEND_URL}/delete-transaction`,
        { transactionId },
        { timeout: 15000 }
      );
      addAlert(response.data.message);
      setSelectedTransactions((prev) => prev.filter((id) => id !== transactionId));
    } catch (error) {
      console.error('Delete error:', error.message, { transactionId, details: error.response?.data?.details });
      const errorMessage = error.response?.data?.error || error.message;
      const errorDetails = error.response?.data?.details ? JSON.stringify(error.response.data.details) : '';
      addAlert(`Failed to delete transaction: ${errorMessage}${errorDetails ? ` (Details: ${errorDetails})` : ''}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) {
      addAlert('No transactions selected for deletion', 'error');
      return;
    }
    setLoading(true);
    try {
      for (const transactionId of selectedTransactions) {
        await handleDelete(transactionId);
      }
    } catch (error) {
      console.error('Bulk delete error:', error.message);
      addAlert(`Failed to delete transactions: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTransaction = (transactionId) => {
    setSelectedTransactions((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleTransactionClick = (sellerId) => {
    setSelectedSellerId(sellerId);
  };

  useEffect(() => {
    if (!auth.currentUser) {
      addAlert('Please log in.', 'error');
      navigate('/login');
      return;
    }

    const q = query(collection(db, 'transactions'), where('status', 'in', ['Pending']));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const transactionData = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            if (data.sellerId) { // Guard against undefined sellerId
              const sellerRef = doc(db, 'sellers', data.sellerId);
              const sellerSnap = await getDoc(sellerRef);
              if (sellerSnap.exists()) {
                const sellerData = sellerSnap.data();
                return {
                  id: docSnap.id,
                  ...data,
                  bankName: sellerData.bankName || 'N/A',
                  accountNumber: sellerData.accountNumber || 'N/A',
                };
              }
            }
            return { id: docSnap.id, ...data };
          })
        );
        console.log('Fetched pending transactions:', transactionData);
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
            {selectedTransactions.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Trash2 className="w-5 h-5" />
                Delete Selected ({selectedTransactions.length})
              </button>
            )}
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
              No pending transactions found.
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
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleTransactionClick(txn.sellerId)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(txn.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectTransaction(txn.id);
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Transaction ID:</span> {txn.id || 'N/A'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Seller ID:</span> {txn.sellerId || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Type:</span> {txn.type || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Status:</span>{' '}
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800`}
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
                    {txn.status === 'Pending' ? (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApprove(txn.id, txn.sellerId); }}
                          disabled={loading || !txn.id || !txn.sellerId}
                          className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 ${
                            loading || !txn.id || !txn.sellerId ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <i className="bx bx-check"></i>
                          Approve
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReject(txn.id, txn.sellerId); }}
                          disabled={loading || !txn.id || !txn.sellerId}
                          className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 ${
                            loading || !txn.id || !txn.sellerId ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <i className="bx bx-x"></i>
                          Reject
                        </button>
                      </div>
                    ) : (txn.status === 'Approved' || txn.status === 'Rejected') && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(txn.id); }}
                          disabled={loading || !txn.id}
                          className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2 ${
                            loading || !txn.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Trash2 className="w-5 h-5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
          <SellerDetailsModal
            isOpen={!!selectedSellerId}
            onClose={() => setSelectedSellerId(null)}
            sellerId={selectedSellerId}
          />
        </div>
      </motion.div>
    </div>
  );
}