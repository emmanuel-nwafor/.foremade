import React, { useState, useEffect } from 'react';
import SellerSidebar from './SellerSidebar';
import SellerOnboardModal from './SellerOnboardModal';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import axios from 'axios';

export default function Wallet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [sellerData, setSellerData] = useState({ fullName: '', accountNumber: '', pendingBalance: 0, availableBalance: 0, bankName: '' });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        if (!auth.currentUser) {
          navigate('/login');
          return;
        }
        const sellerRef = doc(db, 'sellers', auth.currentUser.uid);
        const walletRef = doc(db, 'wallets', auth.currentUser.uid);
        const [sellerSnap, walletSnap] = await Promise.all([getDoc(sellerRef), getDoc(walletRef)]);
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();
          const walletData = walletSnap.exists() ? walletSnap.data() : { pendingBalance: 0, availableBalance: 0 };
          setIsOnboarded(true);
          setSellerData({
            fullName: sellerData.fullName || 'Unknown Seller',
            accountNumber: sellerData.accountNumber || 'N/A',
            pendingBalance: walletData.pendingBalance || 0,
            availableBalance: walletData.availableBalance || 0,
            bankName: sellerData.bankName || 'N/A',
          });

          // Real-time listener for wallet updates
          const unsubscribe = onSnapshot(walletRef, (snap) => {
            if (snap.exists()) {
              const newWalletData = snap.data();
              setSellerData((prev) => ({
                ...prev,
                pendingBalance: newWalletData.pendingBalance || 0,
                availableBalance: newWalletData.availableBalance || 0,
              }));
            }
          }, (error) => {
            console.error('Real-time wallet update error:', error);
          });

          return () => unsubscribe(); // Cleanup on unmount
        }
      } catch (error) {
        console.error('Error fetching seller data:', error);
      } finally {
        setLoading(false);
      }
    };
    checkOnboarding();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-4 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-xl md:text-2xl"></i>
            <span className="text-sm md:text-base">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-4 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <SellerOnboardModal
              isOpen={true}
              title="Complete Onboarding"
              message="You need to complete onboarding to access your wallet."
              primaryAction={{ label: "Go to Onboarding", link: "/seller-onboarding" }}
              secondaryAction={{ label: "Close" }}
            />
          </div>
        </div>
      </div>
    );
  }

  const handleWithdrawRequest = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > sellerData.availableBalance) {
      setError('Please enter a valid amount up to your available balance.');
      return;
    }
    try {
      setLoading(true);
      const sellerId = auth.currentUser.uid;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(
        `${backendUrl}/initiate-seller-payout`,
        {
          sellerId,
          amount,
          transactionReference: `TXN_${Date.now()}`,
          country: sellerData.bankName.includes('OPay') ? 'Nigeria' : 'United Kingdom', // Infer country
        }
      );

      if (response.data.status === 'success') {
        setSellerData((prev) => ({
          ...prev,
          availableBalance: prev.availableBalance - amount,
          pendingBalance: prev.pendingBalance + amount,
        }));
        setWithdrawAmount('');
        setShowWithdrawModal(false);
        setShowSuccessModal(true);
        setError('');
      }
    } catch (error) {
      console.error('Withdrawal request error:', error);
      setError('Failed to request withdrawal. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-2 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
              <i className="bx bx-wallet text-xl sm:text-2xl"></i>
              Smile Wallet
            </h1>
          </div>

          <div className="flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold opacity-90">Available Balance</h3>
                  <p className="text-2xl sm:text-4xl font-bold mt-2">₦{sellerData.availableBalance.toFixed(2)}</p>
                  <p className="text-xs sm:text-xs mt-1 opacity-75">Awaiting admin approval for withdrawal</p>

                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="mt-2 sm:mt-4 w-full sm:w-auto bg-white text-blue-600 px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 transition-colors"
                    disabled={sellerData.availableBalance === 0 || loading}
                  >
                    Withdraw
                  </button>
                </div>

                <p className="text-sm font-bold sm:text-sm md:text-base text-white dark:text-gray-400 mt-1">
                  <br className="hidden sm:block" />
                  Acc No {sellerData.accountNumber || 'N/A'}.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Sales Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full hidden sm:table">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">--</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">--</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-white">--</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">₦0.00</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        --
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="sm:hidden p-4">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Date: <span className="text-gray-900 dark:text-white">--</span></p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Type: <span className="text-gray-900 dark:text-white">--</span></p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Description: <span className="text-gray-900 dark:text-white">--</span></p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Amount: <span className="text-gray-900 dark:text-white">₦0.00</span></p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Status: <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">--</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SellerOnboardModal
        isOpen={showWithdrawModal}
        onClose={() => { setShowWithdrawModal(false); setError(''); }}
        title="Request Withdrawal"
        message={`Request to withdraw ₦${withdrawAmount || '0.00'} from your ${sellerData.bankName} account ending in ${sellerData.accountNumber.slice(-4) || 'N/A'}.`}
        primaryAction={{
          label: "Submit Request",
          onClick: handleWithdrawRequest,
        }}
        secondaryAction={{ label: "Cancel", onClick: () => setShowWithdrawModal(false) }}
        customContent={
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount (₦)
            </label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              disabled={loading}
              min="1"
              max={sellerData.availableBalance}
            />
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          </div>
        }
      />

      <SellerOnboardModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Withdrawal Requested"
        message="Your withdrawal request has been submitted successfully. It will be credited to your account after admin approval."
        primaryAction={{ label: "OK", onClick: () => setShowSuccessModal(false) }}
      />
    </div>
  );
}