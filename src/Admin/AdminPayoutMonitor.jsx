import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import axios from 'axios';

export default function AdminPayoutMonitor() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const fetchRequests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'wallets'));
        const requestsData = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.withdrawalRequests?.status === 'pending') {
            requestsData.push({
              id: docSnap.id,
              ...data.withdrawalRequests,
              pendingBalance: data.pendingBalance,
            });
          }
        });
        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching withdrawal requests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [navigate]);

  const handleApproval = async (requestId, status) => {
    try {
      setLoading(true);
      const walletRef = doc(db, 'wallets', requestId);
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      if (status === 'approved') {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const payoutPayload = {
          amount: request.amount,
          currency: 'NGN',
          sellerId: request.id,
          orderId: `withdrawal-${Date.now()}`,
          handlingFee: 0,
          buyerProtectionFee: 0,
          taxFee: 0,
        };

        const paystackResponse = await axios.post(
          `${backendUrl}/split-payout`,
          payoutPayload,
          {
            headers: { Authorization: `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}` },
          }
        );

        if (paystackResponse.data.message === 'Payout split successfully') {
          await updateDoc(walletRef, {
            availableBalance: request.pendingBalance - request.amount,
            withdrawalRequests: { status: 'approved', timestamp: new Date().toISOString() },
            pendingBalance: 0,
          });
        } else {
          throw new Error('Payout processing failed');
        }
      } else {
        await updateDoc(walletRef, {
          withdrawalRequests: { status: 'rejected', timestamp: new Date().toISOString() },
          pendingBalance: request.pendingBalance + request.amount, // Restore pending balance on rejection
        });
      }
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error('Approval error:', error);
      alert(`Error: ${error.message || 'Failed to process request'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="flex-1 p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Withdrawal Approvals</h1>
        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">Seller ID</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">Amount (₦)</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">Account Number</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">Bank Name</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b dark:border-gray-600">
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{request.id}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{request.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{request.accountNumber}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{request.bankName}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleApproval(request.id, 'approved')}
                      className="bg-green-500 text-white px-2 py-1 rounded mr-2 hover:bg-green-600"
                      disabled={loading}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(request.id, 'rejected')}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}