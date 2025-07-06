import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import axios from 'axios';
import SellerSidebar from './SellerSidebar';
import { Wallet as WalletIcon, ArrowDownCircle } from 'lucide-react';

// Simulated checkout function
const handleCheckout = async (sellerId, productPrice, totalAmount) => {
  console.log(`Checkout triggered for seller ${sellerId} with product price ${productPrice} and total ${totalAmount}`);
  const walletRef = doc(db, 'wallets', sellerId);
  const adminRef = doc(db, 'wallets', 'admin'); // Assuming 'admin' is the admin UID
  const fees = totalAmount - productPrice;
  try {
    await updateDoc(walletRef, {
      availableBalance: db.FieldValue.increment(productPrice),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(adminRef, {
      availableBalance: db.FieldValue.increment(fees),
      updatedAt: serverTimestamp(),
    });
    console.log(`Checkout successful: Added ₦${productPrice} to seller and ₦${fees} to admin`);
  } catch (err) {
    console.error(`Checkout failed for ${sellerId}:`, err);
  }
};

export default function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }
      const walletRef = doc(db, 'wallets', auth.currentUser.uid);
      const walletSnap = await getDoc(walletRef);
      if (walletSnap.exists()) {
        const data = walletSnap.data();
        if (data.pendingBalance && data.pendingBalance > 0) {
          const assumedFees = data.pendingBalance * 0.04958; // ~4.958% fee
          const newBalance = data.pendingBalance - assumedFees;
          await updateDoc(walletRef, {
            availableBalance: newBalance,
            pendingBalance: 0,
            updatedAt: serverTimestamp(),
          });
          setBalance(newBalance);
        } else {
          setBalance(data.availableBalance || 0);
        }
      } else {
        await setDoc(walletRef, {
          availableBalance: 0,
          updatedAt: serverTimestamp(),
          accountDetails: null,
        });
        setBalance(0);
      }
      setLoading(false);
    };
    fetchWallet();

    const walletRef = doc(db, 'wallets', auth.currentUser.uid);
    const unsubscribe = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        setBalance(docSnap.data().availableBalance || 0);
        console.log(`Balance updated to ₦${docSnap.data().availableBalance || 0}`);
      }
    }, (err) => {
      console.error('Snapshot error:', err);
      setError('Failed to update wallet data: ' + err.message);
    });
    return () => unsubscribe();
  }, [navigate, auth.currentUser?.uid]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount.');
      setLoading(false);
      return;
    }
    if (amountNum > balance) {
      setError('Insufficient balance.');
      setLoading(false);
      return;
    }
    try {
      const payload = {
        sellerId: auth.currentUser.uid,
        amount: amountNum,
        transactionReference: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      console.log('Sending withdrawal request to:', 'https://foremade-backend.onrender.com/initiate-seller-payout', payload);
      const response = await axios.post('https://foremade-backend.onrender.com/initiate-seller-payout', payload, {
        timeout: 10000,
      });
      if (response.data.status === 'success') {
        setAmount('');
        alert('Withdrawal request submitted. Awaiting admin approval.');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError('Failed to submit withdrawal: ' + (err.response?.data?.error || err.message || 'Endpoint not found. Check Render deployment at https://dashboard.render.com/'));
    } finally {
      setLoading(false);
    }
  };

  const getAccountDetails = async () => {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.accountDetails || {};
    }
    return {};
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-1">
        <button className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-200 text-gray-700 rounded-lg" onClick={() => {}} aria-label="Open sidebar">
          <i className="bx bx-menu text-xl"></i>
        </button>
        <div className="md:block md:w-64 lg:w-72 bg-gray-50 transition-all duration-300">
          <SellerSidebar />
        </div>
        <div className="flex-1 p-3 sm:p-4 md:p-8">
          <div className="max-w-xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <WalletIcon className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">My Wallet</h1>
            </div>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
            {/* Balance Card */}
            <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-5 sm:p-6 mb-6 flex flex-col gap-2 items-start">
              <div className="flex items-center gap-2 mb-1">
                <WalletIcon className="w-6 h-6 text-blue-500" />
                <span className="font-medium text-gray-500 text-xs sm:text-sm">Wallet ID:</span>
                <span className="font-mono text-xs sm:text-sm text-gray-700">{auth.currentUser.uid}</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-700">Available Balance</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-700">₦{balance.toLocaleString()}</p>
            </div>
            {/* Withdrawal Form */}
            <form onSubmit={handleWithdraw} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowDownCircle className="w-5 h-5 text-green-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Request Withdrawal</h2>
              </div>
              <div className="mb-4">
                <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Amount (₦)</label>
                <input
                  id="withdraw-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 p-2 w-full border border-blue-200 rounded focus:outline-blue-400 focus:ring-2 focus:ring-blue-200 text-base"
                  required
                  aria-label="Withdrawal Amount"
                  min="1"
                  step="any"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: ₦1. Withdrawals are subject to admin approval and may take up to 24 hours.</p>
              </div>
              <button
                type="submit"
                className={`w-full mt-2 sm:mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-300 transition text-base ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
                aria-label="Request Withdrawal"
              >
                Request Withdrawal
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}