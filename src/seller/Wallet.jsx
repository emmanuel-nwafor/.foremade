import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, query, collection, where, increment } from 'firebase/firestore';
import axios from 'axios';
import SellerSidebar from './SellerSidebar';
import { Wallet as WalletIcon, ArrowDownCircle } from 'lucide-react';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const handleCheckout = async (sellerId, productPrice, totalAmount) => {
  console.log(`Checkout triggered for seller ${sellerId} with product price ${productPrice} and total ${totalAmount}`);
  const walletRef = doc(db, 'wallets', sellerId);
  const adminRef = doc(db, 'wallets', 'admin');
  const fees = totalAmount - productPrice;
  try {
    const walletSnap = await getDoc(walletRef);
    if (!walletSnap.exists()) {
      console.log(`Creating new wallet for seller ${sellerId} with pendingBalance: ₦${productPrice}`);
      await setDoc(walletRef, {
        availableBalance: 0,
        pendingBalance: productPrice,
        updatedAt: serverTimestamp(),
        accountDetails: null,
      });
    } else {
      console.log(`Updating wallet for seller ${sellerId}: incrementing pendingBalance by ₦${productPrice}`);
      await updateDoc(walletRef, {
        pendingBalance: increment(productPrice),
        updatedAt: serverTimestamp(),
      });
    }
    await updateDoc(adminRef, {
      availableBalance: increment(fees),
      updatedAt: serverTimestamp(),
    });
    console.log(`Checkout successful: Added ₦${productPrice} to seller pendingBalance and ₦${fees} to admin availableBalance`);
  } catch (err) {
    console.error(`Checkout failed for ${sellerId}:`, err);
    throw new Error(`Checkout failed: ${err.message}`);
  }
};

export default function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const pendingBalanceRef = useRef(0);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    const fetchWallet = async () => {
      const walletRef = doc(db, 'wallets', auth.currentUser.uid);
      try {
        const walletSnap = await getDoc(walletRef);
        console.log(`Fetching wallet for ${auth.currentUser.uid}:`, walletSnap.exists() ? walletSnap.data() : 'No wallet found');
        if (!walletSnap.exists()) {
          console.log(`Creating new wallet for ${auth.currentUser.uid}`);
          await setDoc(walletRef, {
            availableBalance: 0,
            pendingBalance: 0,
            updatedAt: serverTimestamp(),
            accountDetails: null,
          });
        }
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching wallet for ${auth.currentUser.uid}:`, err);
        setError('Failed to load wallet: ' + err.message);
        setLoading(false);
      }
    };
    fetchWallet();

    const walletRef = doc(db, 'wallets', auth.currentUser.uid);
    const unsubscribeWallet = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`Snapshot received for ${auth.currentUser.uid}:`, data);
        setBalance(data.availableBalance || 0);
        setPendingBalance(data.pendingBalance || 0);
        updateChartData(data.availableBalance || 0, data.pendingBalance || 0);
      } else {
        console.log(`No wallet document found for ${auth.currentUser.uid} in snapshot`);
        setBalance(0);
        setPendingBalance(0);
        updateChartData(0, 0);
      }
    }, (err) => {
      console.error('Wallet snapshot error:', err);
      setError('Failed to update wallet data: ' + err.message);
    });

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', auth.currentUser.uid),
      where('type', '==', 'Withdrawal')
    );
    const unsubscribeTransactions = onSnapshot(transactionQuery, () => {}, (err) => {
      console.error('Transaction snapshot error:', err);
      setError('Failed to fetch transaction data: ' + err.message);
    });

    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
    };
  }, [navigate, auth.currentUser?.uid]);

  // Auto-transfer pendingBalance to availableBalance after 10-15 seconds
  useEffect(() => {
    if (pendingBalance > 0 && pendingBalance !== pendingBalanceRef.current) {
      console.log(`Pending balance changed to ₦${pendingBalance}, scheduling transfer to availableBalance`);
      const delay = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000; // Random 10-15s
      const walletRef = doc(db, 'wallets', auth.currentUser.uid);
      const timeout = setTimeout(async () => {
        try {
          console.log(`Transferring ₦${pendingBalance} from pendingBalance to availableBalance for ${auth.currentUser.uid}`);
          await updateDoc(walletRef, {
            availableBalance: increment(pendingBalance),
            pendingBalance: 0,
            updatedAt: serverTimestamp(),
          });
          console.log(`Transfer complete: ₦${pendingBalance} moved to availableBalance`);
        } catch (err) {
          console.error(`Transfer failed for ${auth.currentUser.uid}:`, err);
          setError(`Failed to transfer pending balance: ${err.message} (Check Firebase version or Firestore rules)`);
        }
      }, delay);
      pendingBalanceRef.current = pendingBalance;
      return () => clearTimeout(timeout);
    }
  }, [pendingBalance]);

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
      setError('Insufficient available balance.');
      setLoading(false);
      return;
    }
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    try {
      const payload = {
        sellerId: auth.currentUser.uid,
        amount: amountNum,
        transactionReference: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      console.log('Sending withdrawal request to:', `${BACKEND_URL}/initiate-seller-payout`, payload);
      const response = await axios.post(`${BACKEND_URL}/initiate-seller-payout`, payload, {
        timeout: 10000,
      });
      if (response.data.status === 'success') {
        setAmount('');
        setIsModalOpen(false);
        alert('Withdrawal request submitted. Funds will be credited to your bank account shortly. Some banks may take up to 30 minutes to process.');
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

  const updateChartData = (availableBalance = balance, pendingBalance = 0) => {
    const labels = ['Current State'];
    setChartData({
      labels,
      datasets: [
        {
          label: 'Available Balance',
          data: [availableBalance],
          fill: false,
          backgroundColor: '#3490dc',
          borderColor: '#2563EB',
          tension: 0.4,
          borderWidth: 2,
        },
        {
          label: 'Pending Balance',
          data: [pendingBalance],
          fill: false,
          backgroundColor: '#f6ad55',
          borderColor: '#c08640',
          tension: 0.4,
          borderWidth: 2,
        },
      ],
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₦)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Wallet Overview'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Wallet Wave Statistics'
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 md:gap-6 mb-2 sm:mb-4 md:mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-2 sm:p-4 md:p-6 text-white">
                <span className="text-[10px] sm:text-sm font-light">Wallet ID: {auth.currentUser.uid}</span>
                <h3 className="text-sm sm:text-lg md:text-xl font-semibold mt-1 sm:mt-2">Available Balance</h3>
                <p className="text-2xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">₦{balance.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-2 sm:p-4 md:p-6 text-white">
                <span className="text-xs sm:text-sm font-light">Pending Transactions</span>
                <h3 className="text-sm sm:text-lg md:text-xl font-semibold mt-1 sm:mt-2">Pending Balance</h3>
                <p className="text-2xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">₦{pendingBalance.toLocaleString()}</p>
              </div>
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
            {/* Statistics Chart */}
            <div className="mt-6 h-48 sm:h-64 bg-white p-3 rounded-lg shadow">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Statistics</h2>
              <div className="h-full">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}