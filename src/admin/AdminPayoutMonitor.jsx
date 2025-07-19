
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';

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
  const [loading, setLoading] = useState(false);
  const [otpInputs, setOtpInputs] = useState({});
  const [otpLoading, setOtpLoading] = useState({});

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

    const q = query(
      collection(db, 'transactions'),
      where('type', '==', 'Withdrawal'),
      where('status', 'in', ['Pending', 'pending_otp'])
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const transactionData = [];
      for (const docSnapshot of snapshot.docs) {
        const txn = { id: docSnapshot.id, ...docSnapshot.data() };
        const sellerRef = doc(db, 'sellers', txn.sellerId); // Use sellerId
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
    }, (error) => {
      addAlert('Failed to fetch transactions.', 'error');
      console.error('Firestore listener error:', error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribe && unsubscribe();
    };
  }, [navigate, addAlert]);

  const handleApprove = async (transactionId, sellerId, amount) => {
    setLoading(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${BACKEND_URL}/approve-payout`, { transactionId, sellerId });
      addAlert(response.data.message, 'success');
      if (response.data.transferCode) {
        setOtpInputs((prev) => ({ ...prev, [transactionId]: { transferCode: response.data.transferCode, otp: '' } }));
      }
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

  const handleOtpSubmit = async (transactionId) => {
    setOtpLoading((prev) => ({ ...prev, [transactionId]: true }));
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const { otp } = otpInputs[transactionId] || {};
      if (!otp) {
        addAlert('Missing OTP', 'error');
        return;
      }
      const response = await axios.post(`${BACKEND_URL}/verify-transfer-otp`, { transactionId, otp });
      addAlert(response.data.message, 'success');
      setOtpInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[transactionId];
        return newInputs;
      });
    } catch (error) {
      const errorMsg = error.response?.data?.details || error.response?.data?.error || 'OTP verification failed';
      console.error('OTP verification error:', error.response?.data || error);
      addAlert(errorMsg, 'error');
    } finally {
      setOtpLoading((prev) => ({ ...prev, [transactionId]: false }));
    }
  };

  const handleResendOtp = async (transactionId, sellerId) => {
    setOtpLoading((prev) => ({ ...prev, [transactionId]: true }));
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.post(`${BACKEND_URL}/resend-otp`, { transactionId, sellerId });
      addAlert(response.data.message, 'success');
      setOtpInputs((prev) => ({ ...prev, [transactionId]: { transferCode: response.data.transferCode, otp: '' } }));
    } catch (error) {
      const errorMsg = error.response?.data?.details || 'Failed to resend OTP';
      addAlert(errorMsg, 'error');
      console.error('Resend OTP error:', error.response?.data || error.message);
    } finally {
      setOtpLoading((prev) => ({ ...prev, [transactionId]: false }));
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-5 flex justify-center items-start">
        <div className="w-full lg:max-w-5xl md:max-w-4xl sm:max-w-3xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
            <i className="bx bx-dollar text-blue-500"></i>
            Admin Payout Monitor
          </h2>
          {transactions.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No pending payout requests.</p>
          ) : (
            <div className="space-y-4 mt-6">
              {transactions.map((txn) => (
                <div key={txn.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Transaction ID:</span> {txn.id}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Seller ID:</span> {txn.sellerId}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Seller Name:</span> {txn.sellerName}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Bank Name:</span> {txn.bankName}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Account Number:</span> {txn.accountNumber}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Amount:</span> ₦{txn.amount.toFixed(2)}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Date:</span> {new Date(txn.createdAt?.toDate()).toLocaleString()}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Status:</span> {txn.status}
                  </p>
                  {txn.status === 'Pending' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleApprove(txn.id, txn.sellerId, txn.amount)}
                        className={`py-2 px-4 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 flex items-center gap-2 ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={loading}
                      >
                        <i className="bx bx-check"></i>
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(txn.id, txn.sellerId)}
                        className={`py-2 px-4 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 flex items-center gap-2 ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={loading}
                      >
                        <i className="bx bx-x"></i>
                        Reject
                      </button>
                    </div>
                  )}
                  {txn.status === 'pending_otp' && (
                    <div className="mt-4">
                      <p className="text-gray-700 dark:text-gray-300">Enter OTP sent to your email:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otpInputs[txn.id]?.otp || ''}
                          onChange={(e) =>
                            setOtpInputs((prev) => ({
                              ...prev,
                              [txn.id]: { ...prev[txn.id], otp: e.target.value },
                            }))
                          }
                          placeholder="Enter OTP"
                          className="p-2 border rounded-lg dark:bg-gray-600 dark:text-gray-200"
                        />
                        <button
                          onClick={() => handleOtpSubmit(txn.id)}
                          className={`py-2 px-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2 ${
                            otpLoading[txn.id] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={otpLoading[txn.id]}
                        >
                          <i className="bx bx-send"></i>
                          Submit OTP
                        </button>
                        <button
                          onClick={() => handleResendOtp(txn.id, txn.sellerId)}
                          className={`py-2 px-4 bg-yellow-600 text-white rounded-lg shadow-md hover:bg-yellow-700 flex items-center gap-2 ${
                            otpLoading[txn.id] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={otpLoading[txn.id]}
                        >
                          <i className="bx bx-refresh"></i>
                          Resend OTP
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}
