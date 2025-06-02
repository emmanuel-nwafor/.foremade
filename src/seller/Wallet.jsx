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
  serverTimestamp,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';

// Paystack configuration
const PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
const PAYSTACK_TEST_KEY = process.env.REACT_APP_PAYSTACK_TEST_KEY;
const PAYSTACK_API_URL = 'https://api.paystack.co';

// Function to fetch banks from Paystack API
const fetchBanks = async () => {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/bank`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_TEST_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch banks');
    
    const data = await response.json();
    if (data.status) {
      return data.data;
    }
  } catch (err) {
    console.error('Error fetching banks:', err);
    return [];
  }
};

// Nigerian bank lookup (replace with Paystack API in production)
const nigerianBanks = {
  '044': { name: 'Access Bank', code: '044' },
  '023': { name: 'Citibank Nigeria', code: '023' },
  '063': { name: 'Access Bank (Diamond)', code: '063' },
  '050': { name: 'Ecobank Nigeria', code: '050' },
  '011': { name: 'First Bank of Nigeria', code: '011' },
  '214': { name: 'First City Monument Bank', code: '214' },
  '058': { name: 'Guaranty Trust Bank', code: '058' },
  '030': { name: 'Heritage Bank', code: '030' },
  '301': { name: 'Jaiz Bank', code: '301' },
  '082': { name: 'Keystone Bank', code: '082' },
  '076': { name: 'Polaris Bank', code: '076' },
  '221': { name: 'Stanbic IBTC Bank', code: '221' },
  '232': { name: 'Sterling Bank', code: '232' },
  '032': { name: 'Union Bank of Nigeria', code: '032' },
  '033': { name: 'United Bank for Africa', code: '033' },
  '215': { name: 'Unity Bank', code: '215' },
  '035': { name: 'Wema Bank', code: '035' },
  '057': { name: 'Zenith Bank', code: '057' }
};

export default function Wallet() {
  const [vendor, setVendor] = useState(null);
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    fetchBanks();
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setVendor(user);
        setEmail(user.email || '');
        listenToWalletData(user.uid);
        listenToTransactions(user.uid);
      } else {
        setError('Please log in to view your wallet.');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const fetchBanks = async () => {
    try {
      const banks = await fetchBanks();
      setBanks(banks);
    } catch (err) {
      console.error('Error fetching banks:', err);
      setError('Failed to load bank list. Please try again later.');
    }
  };

  const listenToWalletData = (uid) => {
    const walletRef = doc(db, 'wallets', uid);
    const unsubscribe = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWallet({
          availableBalance: data.availableBalance || 0,
          pendingBalance: data.pendingBalance || 0,
          updatedAt: data.updatedAt?.toDate() || null
        });
        setLoading(false);
      } else {
        setInitialWallet(uid);
      }
    }, (err) => {
      setError('Failed to load wallet data: ' + err.message);
      setLoading(false);
    });
    return unsubscribe;
  };

  const listenToTransactions = (uid) => {
    console.log('Setting up transactions listener for uid:', uid);
    try {
      // Simplified query that doesn't require a composite index
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', uid),
        limit(50)  // Keep more transactions for the wallet view
      );

      return onSnapshot(q, (querySnapshot) => {
        console.log('Transactions data updated, count:', querySnapshot.size);
        const transactions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || null
          };
        });
        // Sort transactions client-side instead
        transactions.sort((a, b) => {
          const dateA = a.createdAt || new Date(0);
          const dateB = b.createdAt || new Date(0);
          return dateB - dateA;
        });
        setTransactions(transactions);
      }, (err) => {
        console.error('Transactions listener error:', err);
        setError('Failed to load transactions: ' + err.message);
      });
    } catch (err) {
      console.error('Error setting up transactions listener:', err);
      setError('Error setting up transactions: ' + err.message);
    }
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
      const response = await fetch(
        `${PAYSTACK_API_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            'Authorization': `Bearer ${PAYSTACK_TEST_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.status) {
        setIsVerified(true);
        setAccountName(data.data.account_name);
        setMessage('Account verified successfully');
      } else {
        setIsVerified(false);
        setMessage('Could not verify account. Please check the details and try again.');
      }
    } catch (err) {
      console.error('Bank verification error:', err);
      setMessage('Failed to verify account. Please try again later.');
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

    if (amount && !isNaN(amount) && amount > 0 && amount <= wallet.availableBalance && isVerified) {
      try {
        // Create transfer recipient
        const recipientResponse = await fetch(`${PAYSTACK_API_URL}/transferrecipient`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PAYSTACK_TEST_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'nuban',
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: 'NGN'
          })
        });

        const recipientData = await recipientResponse.json();
        if (!recipientData.status) throw new Error('Failed to create transfer recipient');

        // Initiate transfer
        const transferResponse = await fetch(`${PAYSTACK_API_URL}/transfer`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PAYSTACK_TEST_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source: 'balance',
            amount: Math.round(amount * 100), // Convert to kobo
            recipient: recipientData.data.recipient_code,
            reason: `Withdrawal to ${accountName}`
          })
        });

        const transferData = await transferResponse.json();
        if (!transferData.status) throw new Error('Failed to initiate transfer');

        // Update Firestore
        const uid = vendor.uid;
        const walletRef = doc(db, 'wallets', uid);
        await updateDoc(walletRef, {
          availableBalance: wallet.availableBalance - amount,
          pendingBalance: wallet.pendingBalance + amount,
          updatedAt: serverTimestamp()
        });

        // Create transaction record
        await addDoc(collection(db, 'transactions'), {
          userId: uid,
          type: 'Withdrawal',
          description: `Withdrawal to ${accountName} (${accountNumber})`,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          status: 'Pending',
          createdAt: serverTimestamp(),
          reference: transferData.data.reference,
          transferCode: transferData.data.transfer_code,
          recipientCode: recipientData.data.recipient_code
        });

        setMessage(`Withdrawal of ₦${amount.toLocaleString()} initiated successfully`);
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
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex flex-1">
        {/* Sidebar Toggle */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-800 text-white rounded-lg"
          onClick={toggleSidebar}
        >
          <i className="bx bx-menu text-xl"></i>
        </button>

        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 bg-blue-900`}>
          <SellerSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Wallet Dashboard</h1>
              {message && (
                <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">
                  {message}
                </div>
              )}
            </div>

            {/* Balance Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold opacity-90">Available Balance</h3>
                <p className="text-3xl font-bold mt-2">₦{wallet.availableBalance.toLocaleString()}</p>
                <p className="text-sm mt-2 opacity-75">Last updated: {wallet.updatedAt?.toLocaleString()}</p>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="mt-4 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Withdraw Funds
                </button>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold opacity-90">Pending Balance</h3>
                <p className="text-3xl font-bold mt-2">₦{wallet.pendingBalance.toLocaleString()}</p>
                <p className="text-sm mt-2 opacity-75">Funds being processed</p>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
              </div>
              <div className="overflow-x-auto">
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
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
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

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Withdraw Funds</h3>
            <form onSubmit={handleWithdraw}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Bank
                  </label>
                  <select
                    value={bankCode}
                    onChange={(e) => {
                      setBankCode(e.target.value);
                      setBankName(banks.find(bank => bank.code === e.target.value)?.name || '');
                    }}
                    className="w-full p-2 border rounded-lg"
                    required
                  >
                    <option value="">Select a bank</option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="flex-1 p-2 border rounded-lg"
                      placeholder="Enter account number"
                      required
                    />
                    <button
                      type="button"
                      onClick={verifyBankAccount}
                      disabled={verificationLoading || !bankCode || !accountNumber}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {verificationLoading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {accountName && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-green-700 text-sm">Account Name: {accountName}</p>
                  </div>
                )}

                {message && (
                  <div className={`p-3 rounded-lg ${isVerified ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <p className="text-sm">{message}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawModal(false);
                      resetWithdrawForm();
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isVerified || isProcessing || !withdrawAmount}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
                      (!isVerified || isProcessing || !withdrawAmount) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}