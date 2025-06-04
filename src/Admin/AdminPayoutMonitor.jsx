import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';

const AdminPayoutMonitor = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const q = query(collection(db, 'transactions'), where('type', '==', 'Withdrawal'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const payoutList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayouts(payoutList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const approvePayout = async (payout) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/approve-payout`, {
        transactionId: payout.id,
        sellerId: payout.userId,
      });

      if (response.data.status === 'redirect') {
        window.location.href = response.data.redirectUrl;
        return;
      }

      alert('Payout approved and processed successfully');
    } catch (error) {
      alert('Failed to approve payout: ' + error.message);
    }
  };

  const rejectPayout = async (payout) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/reject-payout`, {
        transactionId: payout.id,
        sellerId: payout.userId,
      });
      alert('Payout rejected and funds returned to available balance');
    } catch (error) {
      alert('Failed to reject payout: ' + error.message);
    }
  };

  const retryPayout = async (payout) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/approve-payout`, {
        transactionId: payout.id,
        sellerId: payout.userId,
      });
      alert('Payout retry initiated');
    } catch (error) {
      alert('Failed to retry payout: ' + error.message);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex flex-1">
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-200 text-gray-700 rounded-lg"
          onClick={toggleSidebar}
        >
          <i className="bx bx-menu text-xl"></i>
        </button>

        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 lg:w-72 bg-gray-100 transition-all duration-300`}>
          <AdminSidebar />
        </div>

        <div className="flex-1 p-4 md:p-3">
          <div className="max-w-full mx-auto">
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
                      {payout.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => approvePayout(payout)}
                            className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectPayout(payout)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
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
        </div>
      </div>
    </div>
  );
};

export default AdminPayoutMonitor;