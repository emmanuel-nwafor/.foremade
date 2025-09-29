import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, query, collection, where, increment } from 'firebase/firestore';
import axios from 'axios';
import SellerSidebar from './SellerSidebar';
import { Wallet as WalletIcon, ArrowDownCircle } from 'lucide-react';
import Chart from 'react-apexcharts';
import CurrencyConverter from '/src/components/layout/CurrencyConverter';
import PriceFormatter from '/src/components/layout/PriceFormatter';

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
      console.log(`Creating wallet for ${sellerId} with availableBalance: ₦${productPrice}`);
      await setDoc(walletRef, {
        availableBalance: productPrice,
        pendingWithdrawals: 0,
        updatedAt: serverTimestamp(),
        accountDetails,
      });
    } else {
      console.log(`Updating wallet for ${sellerId}: increment availableBalance by ₦${productPrice}`);
      await updateDoc(walletRef, {
        availableBalance: increment(productPrice),
        updatedAt: serverTimestamp(),
        accountDetails,
      });
    }
    await updateDoc(adminRef, {
      availableBalance: increment(fees),
      updatedAt: serverTimestamp(),
    });
    console.log(`Checkout success: ₦${productPrice} to seller availableBalance, ₦${fees} to admin`);
  } catch (err) {
    console.error(`Checkout failed for ${sellerId}:`, err);
    throw new Error(`Checkout failed: ${err.message}`);
  }
};

export default function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(null);
  const [isProSeller, setIsProSeller] = useState(false);
  const [chartData, setChartData] = useState({ series: [], options: {} });

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    
    // Fetch wallet and onboarding status
    const fetchWalletAndStatus = async () => {
      const walletRef = doc(db, 'wallets', auth.currentUser.uid);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        const walletSnap = await getDoc(walletRef);
        console.log(`Fetching wallet for ${auth.currentUser.uid}:`, walletSnap.exists() ? walletSnap.data() : 'No wallet');
        if (!walletSnap.exists()) {
          console.log(`Creating wallet for ${auth.currentUser.uid}`);
          const userSnap = await getDoc(userRef);
          const accountDetails = userSnap.exists() && userSnap.data().accountDetails ? userSnap.data().accountDetails : {
            accountNumber: `MOCK${Math.random().toString().slice(2, 12)}`,
            bankName: 'Mock Bank',
            accountName: 'Mock Seller'
          };
          await setDoc(walletRef, {
            availableBalance: 0,
            pendingWithdrawals: 0,
            updatedAt: serverTimestamp(),
            accountDetails,
          });
        }

        const userSnap = await getDoc(userRef);
        const onboarded = userSnap.exists() && userSnap.data().isOnboarded === true;
        const proSeller = userSnap.exists() && userSnap.data().isProSeller === true;
        console.log(`Seller ${auth.currentUser.uid} onboarding status: ${onboarded ? 'onboarded' : 'not onboarded'}, pro status: ${proSeller ? 'pro' : 'standard'}`);
        setIsOnboarded(onboarded || proSeller); // Override with pro seller status
        setIsProSeller(proSeller);

        setLoading(false);
      } catch (err) {
        console.error(`Error fetching wallet or status for ${auth.currentUser.uid}:`, err);
        setError('Failed to load wallet or status: ' + err.message);
        setLoading(false);
      }
    };
    fetchWalletAndStatus();

    // Wallet snapshot listener
    const walletRef = doc(db, 'wallets', auth.currentUser.uid);
    const unsubscribeWallet = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(`Snapshot for ${auth.currentUser.uid}:`, data);
        setBalance(data.availableBalance || 0);
        setPendingWithdrawals(data.pendingWithdrawals || 0);
        updateChartData(data.availableBalance || 0, data.pendingWithdrawals || 0);
      } else {
        console.log(`No wallet for ${auth.currentUser.uid}`);
        setBalance(0);
        setPendingWithdrawals(0);
        updateChartData(0, 0);
      }
    }, (err) => {
      console.error('Wallet snapshot error:', err);
      setError('Failed to update wallet: ' + err.message);
    });

    // Transaction snapshot listener
    const transactionQuery = query(
      collection(db, 'transactions'),
      where('sellerId', '==', auth.currentUser.uid),
      where('type', '==', 'Withdrawal')
    );
    const unsubscribeTransactions = onSnapshot(
      transactionQuery,
      (snapshot) => {
        console.log(`Received ${snapshot.docs.length} withdrawal transactions for seller ${auth.currentUser.uid}`);
      },
      (err) => {
        console.error('Transaction snapshot error:', err);
        setError(`Failed to fetch transactions: ${err.message}`);
      }
    );

    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
    };
  }, [navigate]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isOnboarded) {
      console.log(`Withdrawal blocked: Seller ${auth.currentUser.uid} is not onboarded`);
      setIsModalOpen(true);
      setLoading(false);
      return;
    }

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
    const BACKEND_URL = 'https://foremade-backend.onrender.com';
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
      // NEW: Removed local updateDoc; backend handles balance updates
      const response = await axios.post(`${BACKEND_URL}/initiate-seller-payout`, payload, { timeout: 10000 });
      if (response.data.status === 'success') {
        setAmount('');
        setIsModalOpen(false);
        alert('Withdrawal submitted. Funds will be credited upon admin approval.');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError('Withdrawal failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = (availableBalance = balance, pendingWithdrawals = 0) => {
    setChartData({
      series: [availableBalance, pendingWithdrawals],
      options: {
        chart: { type: 'area', height: '100%', width: '100%', animations: { enabled: true } },
        xaxis: { categories: ['Balance'] },
        yaxis: { title: { text: 'Amount (NGN)' }, min: 0 },
        stroke: { curve: 'smooth' },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.9, stops: [0, 90, 100] } },
        colors: ['#2563EB', '#c08640'],
        legend: { position: 'top', horizontalAlign: 'center' },
        tooltip: {
          y: { formatter: (value) => `₦${value.toFixed(2)}` },
          custom: ({ series, seriesIndex, dataPointIndex, w }) => {
            return `<div class="p-2 bg-gray-800 text-white rounded-lg">
              ${w.globals.seriesNames[seriesIndex]}: ₦${series[seriesIndex][dataPointIndex].toFixed(2)}
            </div>`;
          },
        },
        dataLabels: { enabled: false },
      },
    });
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
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="max-w-8xl mx-auto w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <WalletIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">My Wallet</h1>
            </div>
            <div className="flex items-center gap-4">
              <CurrencyConverter />
              {isOnboarded !== null && (
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isOnboarded
                      ? 'text-green-600 bg-green-100'
                      : 'text-red-600 bg-red-100'
                  }`}
                >
                  {isOnboarded ? `Status: Onboarded (${isProSeller ? 'Pro' : 'Standard'} Seller)` : <Link to="/seller-onboarding" className="underline">Status: Not Onboarded</Link>}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-30">
                <WalletIcon className="w-16 h-16" />
              </div>
              <span className="text-xs font-light">Wallet ID: {auth.currentUser.uid}</span>
              <h3 className="text-lg font-semibold mt-2">Available Balance</h3>
              <p className="text-2xl font-bold mt-2 bg-white p-2 rounded-lg text-blue-900">
                <PriceFormatter price={balance} />
              </p>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-2 right-2 opacity-30">
                <WalletIcon className="w-16 h-16" />
              </div>
              <span className="text-xs font-light">Pending Transactions</span>
              <h3 className="text-lg font-semibold mt-2">Pending Withdrawals</h3>
              <p className="text-2xl font-bold mt-2 bg-white p-2 rounded-lg text-orange-900">
                <PriceFormatter price={pendingWithdrawals} />
              </p>
            </div>
          </div>
          <form onSubmit={handleWithdraw} className="bg-white border border-gray-100 rounded-2xl shadow-md p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownCircle className="w-5 h-5 text-green-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Request Withdrawal</h2>
            </div>
            <div className="mb-4">
              <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Amount</label>
              <div className="relative">
                <input
                  id="withdraw-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="p-3 pl-10 w-full border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition"
                  required
                  aria-label="Withdrawal Amount"
                  min="1"
                  step="any"
                />
                <i className="bx bx-money absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"></i>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: ₦1. Withdrawals subject to admin approval, may take up to 24 hours.</p>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className={`w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition flex items-center justify-center gap-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
              aria-label="Request Withdrawal"
            >
              <i className="bx bx-wallet"></i>
              Request Withdrawal
              {loading && <i className="bx bx-loader-alt animate-spin"></i>}
            </button>
          </form>
          <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="bx bx-wallet text-blue-600"></i>
              Wallet Balance
            </h2>
            <div className="h-64 sm:h-80">
              <Chart options={chartData.options} series={chartData.series} type="area" height="100%" />
            </div>
          </div>
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Required</h3>
                <p className="text-gray-600 mb-4">Please onboard as a seller to withdraw funds.</p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    aria-label="Close modal"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => navigate('/seller-onboarding')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    aria-label="Go to onboarding"
                  >
                    Onboard Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}