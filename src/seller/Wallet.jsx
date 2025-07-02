import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import axios from 'axios';
import SellerSidebar from './SellerSidebar';

export default function Wallet() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
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
        setBalance(data.availableBalance || 0);
        setPending(data.pendingBalance || 0);
      }
      setLoading(false);
    };
    fetchWallet();
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
        transactionReference: `withdrawal-${Date.now()}`,
      };
      await axios.post('https://foremade-backend.onrender.com/initiate-seller-payout', payload);
      setBalance(balance - amountNum);
      setAmount('');
      alert('Withdrawal request submitted. Awaiting admin approval.');
    } catch (err) {
      setError('Failed to submit withdrawal: ' + err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gray-100">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex flex-1">
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-200 text-gray-700 rounded-lg"
          onClick={() => {}}
        >
          <i className="bx bx-menu text-xl"></i>
        </button>

        <div className="md:block md:w-64 lg:w-72 bg-gray-100 transition-all duration-300">
          <SellerSidebar />
        </div>

        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-full mx-auto">
            <div className="mb-4 md:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Wallet</h1>
              {error && (
                <div className="mt-2 md:mt-4 p-2 sm:p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-semibold opacity-90">Available Balance</h3>
                <p className="text-xl sm:text-3xl font-bold mt-1 md:mt-2">₦{balance.toLocaleString()}</p>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 sm:p-8 text-white">
                <div className="text-xs text-white">
                  <span className="font-light">Wallet ID: {auth.currentUser?.uid.slice(0, 8)}</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold opacity-90">Pending Balance</h3>
                <p className="text-xl sm:text-3xl font-bold mt-1 md:mt-2">₦{pending.toLocaleString()}</p>
                <p className="text-xs sm:text-sm mt-1 md:mt-2 opacity-75">Earnings from recent sales awaiting processing</p>
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="p-4 sm:p-6 border-b">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Request Withdrawal</h2>
              </div>
              <div className="mb-2 sm:mb-4">
                <label className="block text-sm font-medium text-gray-700">Withdrawal Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              <button
                type="submit"
                className={`mt-2 sm:mt-4 bg-blue-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium hover:bg-blue-700 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading}
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