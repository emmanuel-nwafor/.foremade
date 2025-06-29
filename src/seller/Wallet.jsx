import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';

export default function Wallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState({ availableBalance: 0, pendingBalance: 0, currency: 'NGN', bankName: '', accountNumber: '', country: '' });
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const addAlert = (message, type = 'error') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setAlerts((prev) => prev.filter((alert) => alert.id !== id)), 5000);
  };

  useEffect(() => {
    const fetchWallet = async () => {
      if (!auth.currentUser) {
        addAlert('Please log in to view wallet.');
        navigate('/login');
        return;
      }
      try {
        const sellerRef = doc(db, 'sellers', auth.currentUser.uid);
        const walletRef = doc(db, 'wallets', auth.currentUser.uid);
        const [sellerSnap, walletSnap] = await Promise.all([getDoc(sellerRef), getDoc(walletRef)]);
        if (!sellerSnap.exists()) {
          addAlert('Please complete onboarding first.');
          navigate('/seller-onboarding');
          return;
        }
        const sellerData = sellerSnap.data();
        const walletData = walletSnap.exists() ? walletSnap.data() : { availableBalance: 0, pendingBalance: 0 };
        setWallet({
          availableBalance: walletData.availableBalance || 0,
          pendingBalance: walletData.pendingBalance || 0,
          currency: sellerData.country === 'United Kingdom' ? 'GBP' : 'NGN',
          bankName: sellerData.bankName || '',
          accountNumber: sellerData.country === 'United Kingdom' ? sellerData.iban : sellerData.accountNumber,
          country: sellerData.country,
        });
      } catch (error) {
        addAlert('Failed to load wallet.', 'error');
      }
    };
    fetchWallet();
  }, [navigate]);

  const handleWithdraw = async () => {
    if (wallet.availableBalance <= 0) {
      addAlert('No funds to withdraw.');
      return;
    }
    setLoading(true);
    try {
      const reference = `wd-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      await axios.post('https://foremade-backend.onrender.com/initiate-seller-payout', {
        sellerId: auth.currentUser.uid,
        amount: wallet.availableBalance,
        transactionReference: reference,
        country: wallet.country,
      });
      addAlert('Withdrawal request submitted. Awaiting approval.', 'success');
    } catch (error) {
      addAlert(error.response?.data?.details || 'Failed to initiate withdrawal.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <div className="flex-1 p-4 flex justify-center items-start">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <i className="bx bx-wallet text-blue-500"></i>
            Your Wallet
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Balance</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {wallet.currency === 'NGN' ? '₦' : '£'}{wallet.availableBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Balance</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {wallet.currency === 'NGN' ? '₦' : '£'}{wallet.pendingBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Bank</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {wallet.bankName} ({wallet.accountNumber})
              </p>
            </div>
            <button
              onClick={handleWithdraw}
              className={`w-full py-2 px-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 ${
                loading || wallet.availableBalance <= 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading || wallet.availableBalance <= 0}
            >
              <i className="bx bx-money-withdraw"></i>
              Withdraw Funds
            </button>
          </div>
          <div className="fixed bottom-4 right-4 space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg shadow-md ${alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}