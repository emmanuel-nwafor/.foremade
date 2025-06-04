import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';

// Paystack configuration
const PAYSTACK_API_URL = 'https://foremade-backend.onrender.com'; // Updated to deployed server

// Function to fetch banks from Paystack API via server
const fetchBanksFromPaystack = async () => {
  try {
    console.log('Attempting to fetch banks from:', `${PAYSTACK_API_URL}/fetch-banks`);
    const response = await fetch(`${PAYSTACK_API_URL}/fetch-banks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Fetch failed with status:', response.status);
      throw new Error(`Failed to fetch banks: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched banks:', data);
    return data;
  } catch (err) {
    console.error('Error fetching banks:', err.message);
    return [];
  }
};

export default function Wallet() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState({ availableBalance: 0, pendingBalance: 0, updatedAt: null });
  const [transactions, setTransactions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [banks, setBanks] = useState([]);
  const [accountName, setAccountName] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [country, setCountry] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user logged in, redirecting to login');
      navigate('/login');
      return;
    }

    console.log('User logged in:', user.uid);
    setEmail(user.email || '');

    const checkUserStatus = async (uid) => {
      try {
        console.log('Checking user status for:', uid);
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        const exists = userDoc.exists();
        console.log('User document exists:', exists);
        if (!exists) {
          console.log('User document does not exist, redirecting to login');
          navigate('/login');
        }
        return exists;
      } catch (err) {
        console.error('Error checking user status:', err);
        setError('Error checking user status: ' + err.message);
        setLoading(false);
        return false;
      }
    };

    console.log(bankName)

    const initializeData = async () => {
      const userExists = await checkUserStatus(user.uid);
      if (!userExists) return;

      const unsubscribeWallet = listenToWalletData(user.uid);
      const unsubscribeTransactions = listenToTransactions(user.uid);

      return () => {
        if (unsubscribeWallet) unsubscribeWallet();
        if (unsubscribeTransactions) unsubscribeTransactions();
      };
    };

    initializeData().finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!loading && auth.currentUser && location.pathname !== '/login') {
      fetchBanksFromPaystack().then(setBanks);
    }
  }, [loading, location.pathname]);

  const listenToWalletData = (uid) => {
    const walletRef = doc(db, 'wallets', uid);
    return onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWallet({
          availableBalance: data.availableBalance || 0,
          pendingBalance: data.pendingBalance || 0,
          updatedAt: data.updatedAt?.toDate() || null
        });
      } else {
        setInitialWallet(uid);
      }
    }, (err) => {
      console.error('Wallet listener error:', err);
      setError('Failed to load wallet data: ' + err.message);
    });
  };

  const listenToTransactions = (uid) => {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', uid)
    );

    return onSnapshot(q, (querySnapshot) => {
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || null
      }));
      setTransactions(transactions);
    }, (err) => {
      console.error('Transactions listener error:', err);
      setError('Failed to load transactions: ' + err.message);
    });
  };

  const setInitialWallet = async (uid) => {
    try {
      const walletRef = doc(db, 'wallets', uid);
      await setDoc(walletRef, {
        availableBalance: 0,
        pendingBalance: 0,
        updatedAt: serverTimestamp()
      });
      setWallet({ availableBalance: 0, pendingBalance: 0, updatedAt: new Date() });
      setLoading(false);
    } catch (err) {
      setError('Error initializing wallet: ' + err.message);
      setLoading(false);
    }
  };

  const verifyBankAccount = async () => {
    if (!accountNumber || !bankCode) {
      setMessage('Please enter account number and select a bank');
      return;
    }

    setVerificationLoading(true);
    setMessage('');
    setIsVerified(false);
    setAccountName('');

    try {
      console.log('Verifying account with server:', `${PAYSTACK_API_URL}/verify-bank-account`);
      const response = await fetch(`${PAYSTACK_API_URL}/verify-bank-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, bankCode }),
      });

      console.log('Server Response Status:', response.status);

      const data = await response.json();
      console.log('Server Response Data:', data);

      if (response.status === 401) {
        setMessage('Authentication failed. Please check server configuration.');
        return;
      }

      if (data.status === 'success') {
        setIsVerified(true);
        setAccountName(data.accountName);
        setMessage('Account verified successfully');
      } else {
        setIsVerified(false);
        setMessage(`Could not verify account. Error: ${data.message || 'Unknown'}`);
      }
    } catch (err) {
      console.error('Bank verification error:', err);
      setMessage('Failed to verify account. Please try again later. Error: ' + err.message);
      setIsVerified(false);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage('');
    const amount = parseFloat(withdrawAmount);

    if (!country) {
      setError('Please select a country.');
      setIsProcessing(false);
      return;
    }

    if (amount && !isNaN(amount) && amount > 0 && amount <= wallet.availableBalance && isVerified) {
      try {
        const uid = auth.currentUser.uid;
        const transactionReference = `withdrawal-${uid}-${Date.now()}`;

        const response = await fetch(`${PAYSTACK_API_URL}/initiate-seller-payout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellerId: uid,
            amount,
            transactionReference,
            bankCode: country === 'Nigeria' ? bankCode : undefined,
            accountNumber: country === 'Nigeria' ? accountNumber : undefined,
            country,
            email,
          }),
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        if (result.status === 'redirect') {
          setMessage('Redirecting to Stripe for onboarding...');
          window.location.href = result.redirectUrl;
          return;
        }

        setMessage(`Withdrawal request of ₦${amount.toLocaleString()} submitted successfully. Awaiting admin approval.`);
        setShowWithdrawModal(false);
        resetWithdrawForm();
      } catch (err) {
        console.error('Withdrawal error:', err);
        setError('Withdrawal failed: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setError('Invalid amount, insufficient balance, or unverified account.');
      setIsProcessing(false);
    }
  };

  const resetWithdrawForm = () => {
    setWithdrawAmount('');
    setAccountNumber('');
    setBankCode('');
    setBankName('');
    setIsVerified(false);
    setAccountName('');
    setCountry('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
          <Link to="/login" className="text-blue-600 hover:underline mt-2 inline-block">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex flex-1">
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-200 text-gray-700 rounded-lg"
          onClick={toggleSidebar}
        >
          <i className="bx bx-menu text-xl"></i>
        </button>

        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 lg:w-72 bg-gray-100 transition-all duration-300`}>
          <SellerSidebar />
        </div>

        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-full mx-auto">
            <div className="mb-4 md:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Wallet Dashboard</h1>
              {message && (
                <div className="mt-2 md:mt-4 p-2 sm:p-4 bg-green-50 text-green-700 rounded-lg">
                  {message}
                </div>
              )}
              {error && (
                <div className="mt-2 md:mt-4 p-2 sm:p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-semibold opacity-90">Available Balance</h3>
                <p className="text-xl sm:text-3xl font-bold mt-1 md:mt-2">₦{wallet.availableBalance.toLocaleString()}</p>
                <p className="text-xs sm:text-sm mt-1 md:mt-2 opacity-75">Last updated: {wallet.updatedAt?.toLocaleString()}</p>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="mt-2 sm:mt-4 bg-white text-blue-600 px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Withdraw Funds
                </button>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-semibold opacity-90">Pending Balance</h3>
                <p className="text-xl sm:text-3xl font-bold mt-1 md:mt-2">₦{wallet.pendingBalance.toLocaleString()}</p>
                <p className="text-xs sm:text-sm mt-1 md:mt-2 opacity-75">Funds being processed</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 sm:p-6 border-b">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Transactions</h2>
              </div>
              <div className="block sm:hidden">
                {transactions.map((transaction, index) => (
                  <div key={`${transaction.id}-${index}`} className="border-b p-4">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Date:</span>
                      <span className="text-gray-900">{new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="text-gray-900">{transaction.type}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-medium text-gray-700">Description:</span>
                      <span className="text-gray-900">{transaction.description}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-medium text-gray-700">Amount:</span>
                      <span className="text-gray-900">₦{transaction.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((transaction, index) => (
                      <tr key={`${transaction.id}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₦{transaction.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 sm:p-6 max-md:p-4 rounded-lg shadow-lg w-full max-w-xs sm:max-w-md md:max-w-lg">
            <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4">Withdraw Funds</h2>
            <form onSubmit={handleWithdraw}>
              <div className="mb-2 sm:mb-4">
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 p-2 w-full border rounded"
                  required
                >
                  <option value="">Select Country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>
              <div className="mb-2 sm:mb-4">
                <label className="block text-sm font-medium text-gray-700">Amount (₦)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              {country === 'Nigeria' && (
                <>
                  <div className="mb-2 sm:mb-4">
                    <label className="block text-sm font-medium text-gray-700">Select Bank</label>
                    <select
                      value={bankCode}
                      onChange={(e) => {
                        setBankCode(e.target.value);
                        setBankName(banks.find(bank => bank.code === e.target.value)?.name || '');
                      }}
                      className="mt-1 p-2 w-full border rounded-lg"
                      required
                    >
                      <option value="">Select a bank</option>
                      {banks.length > 0 ? (
                        banks.map((bank, index) => (
                          <option key={`${bank.code}-${index}`} value={bank.code}>
                            {bank.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>Loading banks...</option>
                      )}
                    </select>
                  </div>
                  <div className="mb-2 sm:mb-4">
                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="flex-1 p-2 border rounded-lg"
                        placeholder="e.g., 9121059853"
                        required
                      />
                      <button
                        type="button"
                        onClick={verifyBankAccount}
                        disabled={verificationLoading || !bankCode || !accountNumber}
                        className={`px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {verificationLoading ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                  {accountName && (
                    <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                      <p className="text-green-700 text-sm">Account Name: {accountName}</p>
                    </div>
                  )}
                </>
              )}
              <div className="mb-2 sm:mb-4">
                <label className="block text-sm font-medium text-gray-700">Email (for verification)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              {message && (
                <div className={`mb-2 sm:mb-4 p-2 rounded-lg ${isVerified ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <p className="text-sm">{message}</p>
                </div>
              )}
              {error && (
                <div className="mb-2 sm:mb-4 p-2 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    resetWithdrawForm();
                  }}
                  className="px-2 sm:px-4 py-1 sm:py-2 text-gray-700 hover:bg-gray-100 rounded-lg w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isVerified || isProcessing || !withdrawAmount || !country}
                  className={`px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg ${
                    (!isVerified || isProcessing || !withdrawAmount || !country) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  } w-full sm:w-auto`}
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