import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, query, collection, where } from 'firebase/firestore';
import axios from 'axios';
import SellerSidebar from './SellerSidebar';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const handleCheckout = async (sellerId, productPrice, totalAmount) => {
  console.log(`Checkout triggered for seller ${sellerId} with product price ${productPrice} and total ${totalAmount}`);
  const walletRef = doc(db, 'wallets', sellerId);
  const adminRef = doc(db, 'wallets', 'admin');
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
  const [pendingBalance, setPendingBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const fetchWallet = async () => {
      const walletRef = doc(db, 'wallets', auth.currentUser.uid);
      const walletSnap = await getDoc(walletRef);
      if (!walletSnap.exists()) {
        await setDoc(walletRef, {
          availableBalance: 0,
          pendingBalance: 0,
          updatedAt: serverTimestamp(),
          accountDetails: null,
        });
      }
      setLoading(false);
    };

    fetchWallet();

    const walletRef = doc(db, 'wallets', auth.currentUser.uid);
    const unsubscribeWallet = onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBalance(data.availableBalance || 0);
        setPendingBalance(data.pendingBalance || 0);
        console.log(`Balance updated to ₦${data.availableBalance || 0}, Pending: ₦${data.pendingBalance || 0}`);
        updateChartData();
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
    const unsubscribeTransactions = onSnapshot(transactionQuery, (snapshot) => {
      let totalWithdrawals = 0;
      snapshot.forEach((doc) => {
        totalWithdrawals += doc.data().amount || 0;
      });
      updateChartData(totalWithdrawals);
    }, (err) => {
      console.error('Transaction snapshot error:', err);
      setError('Failed to fetch transaction data: ' + err.message);
    });

    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
    };
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

  const updateChartData = (totalWithdrawals = 0) => {
    const labels = ['Current State'];
    setChartData({
      labels,
      datasets: [
        {
          label: 'Available Balance',
          data: [balance],
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
        {
          label: 'Total Withdrawals',
          data: [totalWithdrawals],
          fill: false,
          backgroundColor: '#718096',
          borderColor: '#4a5568',
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
      <div className="min-h-screen flex bg-gray-100">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-2 sm:p-4 flex justify-center items-center">
          <div className="animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex flex-1">
        <div className="md:block md:w-64 lg:w-72 bg-gray-100 transition-all duration-300">
          <SellerSidebar />
        </div>

        <div className="flex-1 p-2 sm:p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-2 sm:mb-4 md:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Smile Wallet</h1>
              {error && <div className="mt-1 sm:mt-2 md:mt-4 p-1 sm:p-2 md:p-3 bg-red-100 text-red-700 rounded-lg text-sm sm:text-base">{error}</div>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4 md:gap-6 mb-2 sm:mb-4 md:mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-2 sm:p-4 md:p-6 text-white">
                <span className="text-[10px] sm:text-sm font-light">Wallet ID: {auth.currentUser.uid}</span>
                <h3 className="text-sm sm:text-lg md:text-xl font-semibold mt-1 sm:mt-2">Available Balance</h3>
                <p className="text-2xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">₦{balance.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-2 sm:p-4 md:p-6 text-white">
                <span className="text-xs sm:text-sm font-light">Pending Withdrawals</span>
                <h3 className="text-sm sm:text-lg md:text-xl font-semibold mt-1 sm:mt-2">Pending Balance</h3>
                <p className="text-2xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2">₦{pendingBalance.toLocaleString()}</p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto bg-blue-600 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2 md:py-3 rounded-lg hover:bg-blue-700 text-sm sm:text-base md:text-lg font-medium"
            >
              Withdraw
            </button>

            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-2 sm:p-4 md:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4">Request Withdrawal</h2>
                  {error && <div className="mb-1 sm:mb-2 md:mb-4 p-1 sm:p-2 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                  <form onSubmit={handleWithdraw}>
                    <div className="mb-2 sm:mb-3 md:mb-4">
                      <label className="block text-sm sm:text-base md:text-lg font-medium text-gray-700">Withdrawal Amount (₦)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 p-1 sm:p-2 md:p-2 w-full border rounded-lg text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-1 sm:gap-2 md:gap-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-2 sm:px-3 md:px-4 py-1 sm:py-1 md:py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''} text-sm sm:text-base`}
                        disabled={loading}
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="mt-2 sm:mt-4 md:mt-6 h-32 sm:h-48 md:h-64 bg-white p-1 sm:p-2 md:p-4 rounded-lg shadow">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-1 sm:mb-2 md:mb-4">Statistics</h2>
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