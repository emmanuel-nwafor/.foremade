import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import SellerSidebar from './SellerSidebar';
import { Link } from 'react-router-dom';

// Mock Nigerian bank lookup (replace with Paystack API in production)
const nigerianBanks = {
  '069': { name: 'Access Bank', code: '069' },
  '044': { name: 'Access Bank (Diamond)', code: '044' },
  '050': { name: 'Ecobank Nigeria', code: '050' },
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState({ availableBalance: 0, pendingBalance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setVendor(user);
        setEmail(user.email || '');
        listenToWalletData(user.uid);
        listenToTransactions(user.uid);
      } else {
        setError('Please log in to view your dashboard.');
        setLoading(false);
      }
    }, (err) => {
      setError('Authentication error: ' + err.message);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const listenToWalletData = (uid) => {
    const walletRef = doc(db, 'wallets', uid);
    const unsubscribe = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        setWallet(docSnap.data());
        setLoading(false);
      } else {
        setInitialWallet(uid);
        setWallet({ availableBalance: 0, pendingBalance: 0 });
        setLoading(false);
      }
    }, (err) => {
      setError('Failed to fetch wallet data: ' + err.message);
      setLoading(false);
    });
    return unsubscribe;
  };

  const listenToTransactions = (uid) => {
    const q = query(collection(db, 'transactions'), where('userId', '==', uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(transactionList);
    }, (err) => {
      setError('Failed to fetch transactions: ' + err.message);
    });
    return unsubscribe;
  };

  const setInitialWallet = async (uid) => {
    try {
      const walletRef = doc(db, 'wallets', uid);
      await setDoc(walletRef, {
        availableBalance: 0,
        pendingBalance: 0,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error initializing wallet:', err);
      setError('Error initializing wallet: ' + err.message);
    }
  };

  const verifyBankAccount = () => {
    const bankCode = accountNumber.slice(0, 3);
    const bank = nigerianBanks[bankCode];
    if (bank) {
      setBankName(bank.name);
      setIsVerified(true);
      setMessage('Bank verified successfully.');
    } else {
      setBankName('');
      setIsVerified(false);
      setMessage('Bank not recognized. Please enter bank name manually.');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage('');
    const amount = parseFloat(withdrawAmount);

    if (amount && !isNaN(amount) && amount > 0 && amount <= wallet.availableBalance && isVerified && email) {
      try {
        const uid = vendor.uid;
        const walletRef = doc(db, 'wallets', uid);
        await updateDoc(walletRef, {
          availableBalance: wallet.availableBalance - amount,
          pendingBalance: wallet.pendingBalance + amount,
          updatedAt: serverTimestamp(),
        });

        // Initiate Paystack transfer (mocked for now)
        const response = await fetch('/initiate-paystack-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            email,
            bank: { account_number: accountNumber, bank_code: accountNumber.slice(0, 3) },
            currency: 'NGN',
            metadata: { userId: uid, description: `Withdrawal to ${bankName}` },
          }),
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        await addDoc(collection(db, 'transactions'), {
          userId: uid,
          type: 'Withdrawal',
          description: `Withdrawal to ${bankName} (${accountNumber})`,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          status: 'Pending',
          createdAt: serverTimestamp(),
          reference: result.reference || 'mock-ref-' + Date.now(),
        });

        setMessage(`Withdrawal request of ₦${amount} to ${bankName} (${accountNumber}) submitted. Awaiting processing.`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setAccountNumber('');
        setBankName('');
        setIsVerified(false);
      } catch (err) {
        setError('Withdrawal failed: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setError('Invalid amount, insufficient balance, unverified bank, or missing email.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 mt-2">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <p className="text-gray-600">
            <Link to="/login" className="text-blue-600 hover:underline">
              Return to Login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const totalWithdrawals = transactions.filter(t => t.type === 'Withdrawal').length;
  const successfulWithdrawals = transactions.filter(t => t.type === 'Withdrawal' && t.status === 'Available').length;
  const pendingWithdrawals = transactions.filter(t => t.type === 'Withdrawal' && t.status === 'Pending').length;
  const failedWithdrawals = transactions.filter(t => t.type === 'Withdrawal' && t.status === 'Failed').length;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex flex-1">
        {/* Toggle button for mobile */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-800 text-white rounded-lg"
          onClick={toggleSidebar}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 bg-blue-900 text-white flex flex-col z-50 transition-all duration-300 ease-in-out`}
        >
          <SellerSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Wallet Overview</h2>

            {message && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* Balance Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm">Available Balance</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">₦{wallet.availableBalance.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Withdrawable now</p>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={isProcessing}
                  className={`mt-3 inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-200 text-sm ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Withdraw Funds
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-sm">Pending Balance</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">₦{wallet.pendingBalance.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Awaiting confirmation</p>
                <Link
                  to="/pending-details"
                  className="mt-3 inline-block bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition duration-200 text-sm"
                >
                  View Details
                </Link>
              </div>
            </div>

            {/* Transaction Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-sm">Total Withdrawals</span>
                <p className="text-xl font-semibold text-gray-800">{totalWithdrawals}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm">Successful</span>
                <p className="text-xl font-semibold text-gray-800">{successfulWithdrawals}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-sm">Pending</span>
                <p className="text-xl font-semibold text-gray-800">{pendingWithdrawals}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full text-sm">Failed</span>
                <p className="text-xl font-semibold text-gray-800">{failedWithdrawals}</p>
              </div>
            </div>

            {/* Transaction History Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-600">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b text-gray-700">
                        <td className="py-2 px-3">{transaction.date}</td>
                        <td className="py-2 px-3">{transaction.description || transaction.type}</td>
                        <td className="py-2 px-3">₦{transaction.amount.toFixed(2)}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${
                              transaction.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : transaction.status === 'Available'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Withdrawal Analysis Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Withdrawal Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-600">Total Withdrawals</span>
                  <p className="text-xl font-semibold text-gray-800">{totalWithdrawals} <span className="text-green-600 text-sm">+0%</span></p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-600">Successful</span>
                  <p className="text-xl font-semibold text-gray-800">{successfulWithdrawals} <span className="text-green-600 text-sm">+0%</span></p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-600">Pending</span>
                  <p className="text-xl font-semibold text-gray-800">{pendingWithdrawals} <span className="text-yellow-600 text-sm">+0%</span></p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-600">Failed</span>
                  <p className="text-xl font-semibold text-gray-800">{failedWithdrawals} <span className="text-red-600 text-sm">+0%</span></p>
                </div>
              </div>
              <div className="h-40">
                <canvas id="withdrawalChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 max-md:p-10 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Withdraw Funds</h2>
            <form onSubmit={handleWithdraw}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Amount (₦)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    verifyBankAccount();
                  }}
                  className="mt-1 p-2 w-full border rounded"
                  placeholder="e.g., 1234567890"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-1 p-2 w-full border rounded"
                  placeholder="Will auto-fill or enter manually"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Email (for verification)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !isVerified}
                  className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? 'Processing...' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}