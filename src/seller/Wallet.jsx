import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, query, collection, where, increment } from 'firebase/firestore';
import axios from 'axios';
import SellerSidebar from './SellerSidebar';
import { Wallet as WalletIcon, ArrowDownCircle } from 'lucide-react';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import CurrencyConverter from '/src/components/layout/CurrencyConverter';
import PriceFormatter from '/src/components/layout/PriceFormatter';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const handleCheckout = async (sellerId, productPrice, totalAmount) => {
  console.log(`Checkout for seller ${sellerId}: price ₦${productPrice}, total ₦${totalAmount}`);
  const walletRef = doc(db, 'wallets', sellerId);
  const adminRef = doc(db, 'wallets', 'admin');
  const fees = totalAmount - productPrice;
  try {
    const walletSnap = await getDoc(walletRef);
    let accountDetails = walletSnap.exists() ? walletSnap.data().accountDetails : null;
    
    if (!accountDetails) {
      console.log(`No account details for ${sellerId}, fetching from users collection`);
      const userRef = doc(db, 'users', sellerId);
      const userSnap = await getDoc(userRef);
      accountDetails = userSnap.exists() && userSnap.data().accountDetails ? userSnap.data().accountDetails : {
        accountNumber: `MOCK${Math.random().toString().slice(2, 12)}`,
        bankName: 'Mock Bank',
        accountName: 'Mock Seller'
      };
      console.log(`Account details for ${sellerId}:`, accountDetails);
    }

    if (!walletSnap.exists()) {
      console.log(`Creating wallet for ${sellerId} with pendingBalance: ₦${productPrice}`);
      await setDoc(walletRef, {
        availableBalance: 0,
        pendingBalance: productPrice,
        updatedAt: serverTimestamp(),
        accountDetails,
      });
    } else {
      console.log(`Updating wallet for ${sellerId}: increment pendingBalance by ₦${productPrice}`);
      await updateDoc(walletRef, {
        pendingBalance: increment(productPrice),
        updatedAt: serverTimestamp(),
        accountDetails,
      });
    }
    await updateDoc(adminRef, {
      availableBalance: increment(fees),
      updatedAt: serverTimestamp(),
    });
    console.log(`Checkout success: ₦${productPrice} to seller pendingBalance, ₦${fees} to admin`);
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
        console.log(`Fetching wallet for ${auth.currentUser.uid}:`, walletSnap.exists() ? walletSnap.data() : 'No wallet');
        if (!walletSnap.exists()) {
          console.log(`Creating wallet for ${auth.currentUser.uid}`);
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          const accountDetails = userSnap.exists() && userSnap.data().accountDetails ? userSnap.data().accountDetails : {
            accountNumber: `MOCK${Math.random().toString().slice(2, 12)}`,
            bankName: 'Mock Bank',
            accountName: 'Mock Seller'
          };
          await setDoc(walletRef, {
            availableBalance: 0,
            pendingBalance: 0,
            updatedAt: serverTimestamp(),
            accountDetails,
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
        console.log(`Snapshot for ${auth.currentUser.uid}:`, data);
        setBalance(data.availableBalance || 0);
        setPendingBalance(data.pendingBalance || 0);
        updateChartData(data.availableBalance || 0, data.pendingBalance || 0);
      } else {
        console.log(`No wallet for ${auth.currentUser.uid}`);
        setBalance(0);
        setPendingBalance(0);
        updateChartData(0, 0);
      }
    }, (err) => {
      console.error('Wallet snapshot error:', err);
      setError('Failed to update wallet: ' + err.message);
    });

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', auth.currentUser.uid),
      where('type', '==', 'Withdrawal')
    );
    const unsubscribeTransactions = onSnapshot(transactionQuery, () => {}, (err) => {
      console.error('Transaction snapshot error:', err);
      setError('Failed to fetch transactions: ' + err.message);
    });

    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
    };
  }, [navigate]);

  useEffect(() => {
    if (pendingBalance > 0 && pendingBalance !== pendingBalanceRef.current) {
      console.log(`Pending balance changed to ₦${pendingBalance}, scheduling transfer`);
      const delay = Math.floor(Math.random() * (15000 - 10000 + 1)) + 10000;
      const walletRef = doc(db, 'wallets', auth.currentUser.uid);
      const timeout = setTimeout(async () => {
        try {
          console.log(`Transferring ₦${pendingBalance} to availableBalance`);
          await updateDoc(walletRef, {
            availableBalance: increment(pendingBalance),
            pendingBalance: 0,
            updatedAt: serverTimestamp(),
          });
          console.log(`Transfer complete: ₦${pendingBalance} moved`);
        } catch (err) {
          console.error(`Transfer failed:`, err);
          setError(`Failed to transfer: ${err.message}`);
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
      setError('Enter a valid amount.');
      setLoading(false);
      return;
    }
    if (amountNum > balance) {
      setError('Insufficient balance.');
      setLoading(false);
      return;
    }
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    try {
      const walletRef = doc(db, 'wallets', auth.currentUser.uid);
      const walletSnap = await getDoc(walletRef);
      const accountDetails = walletSnap.exists() && walletSnap.data().accountDetails ? walletSnap.data().accountDetails : {
        accountNumber: `MOCK${Math.random().toString().slice(2, 12)}`,
        bankName: 'Mock Bank',
        accountName: 'Mock Seller'
      };
      const payload = {
        sellerId: auth.currentUser.uid,
        amount: amountNum,
        transactionReference: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        accountDetails,
      };
      console.log('Withdrawal request:', `${BACKEND_URL}/initiate-seller-payout`, payload);
      const response = await axios.post(`${BACKEND_URL}/initiate-seller-payout`, payload, { timeout: 10000 });
      if (response.data.status === 'success') {
        await updateDoc(walletRef, {
          availableBalance: increment(-amountNum),
          updatedAt: serverTimestamp(),
        });
        setAmount('');
        setIsModalOpen(false);
        alert('Withdrawal submitted. Funds credited in real-time.');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError('Withdrawal failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
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
      y: { beginAtZero: true, title: { display: true, text: 'Amount' } },
      x: { title: { display: true, text: 'Wallet Overview' } }
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Wallet Wave Statistics' }
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
        <div className="hidden md:block md:w-64 lg:w-72 bg-gray-50 transition-all duration-300">
          <SellerSidebar />
        </div>
        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <WalletIcon className="w-7 h-7 text-blue-600" />
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">My Wallet</h1>
              </div>
              <CurrencyConverter />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 sm:p-5 text-white">
                <span className="text-xs sm:text-sm font-light">Wallet ID: {auth.currentUser.uid}</span>
                <h3 className="text-lg sm:text-xl font-semibold mt-2">Available Balance</h3>
                <p className="text-2xl sm:text-3xl font-bold mt-2 bg-white p-1 rounded-lg"><PriceFormatter price={balance} /></p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-5 sm:p-5 text-white">
                <span className="text-xs sm:text-sm font-light">Pending Transactions</span>
                <h3 className="text-lg sm:text-xl font-semibold mt-2">Pending Balance</h3>
                <p className="text-2xl sm:text-3xl font-bold mt-2 bg-white p-1 rounded-lg"><PriceFormatter price={pendingBalance} /></p>
              </div>
            </div>
            <form onSubmit={handleWithdraw} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowDownCircle className="w-5 h-5 text-green-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Request Withdrawal</h2>
              </div>
              <div className="mb-4">
                <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Amount</label>
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
                <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: 1. Withdrawals subject to admin approval, may take up to 24 hours.</p>
              </div>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button
                type="submit"
                className={`w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-blue-400 focus:ring-2 focus:ring-blue-300 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
                aria-label="Request Withdrawal"
              >
                Request Withdrawal
              </button>
            </form>
            <div className="mt-6 h-64 sm:h-80 bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Statistics</h2>
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