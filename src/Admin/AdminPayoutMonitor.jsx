import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import axios from 'axios';

const AdminPayoutMonitor = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('type', '==', 'Payout'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const payoutList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayouts(payoutList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const retryPayout = async (payout) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/initiate-seller-payout`, {
        sellerId: payout.userId,
        amount: payout.amount,
        transactionReference: payout.reference
      });
      alert('Payout retry initiated');
    } catch (error) {
      alert('Failed to retry payout: ' + error.message);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Payout Monitor</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4 border-b">Seller ID</th>
            <th className="py-2 px-4 border-b">Amount (₦)</th>
            <th className="py-2 px-4 border-b">Description</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((payout) => (
            <tr key={payout.id} className="border-b">
              <td className="py-2 px-4">{payout.userId}</td>
              <td className="py-2 px-4">{payout.amount.toFixed(2)}</td>
              <td className="py-2 px-4">{payout.description}</td>
              <td className="py-2 px-4">{payout.status}</td>
              <td className="py-2 px-4">
                {payout.status === 'Failed' && (
                  <button
                    onClick={() => retryPayout(payout)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Retry
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {payouts.length === 0 && <p className="text-center mt-4">No payouts found.</p>}
    </div>
  );
};

export default AdminPayoutMonitor;