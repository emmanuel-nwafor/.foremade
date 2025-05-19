import React, { useState, useEffect } from 'react';
import SellerSidebar from './SellerSidebar';
import { vendorAuth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function Wallet() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock wallet data
  const mockWallet = {
    balance: 100.50,
    transactions: [
      { id: 1, type: 'Credit', amount: 50.00, date: '2025-05-15', description: 'Sale of Product A' },
      { id: 2, type: 'Debit', amount: -20.00, date: '2025-05-16', description: 'Withdrawal to Bank' },
      { id: 3, type: 'Credit', amount: 70.50, date: '2025-05-17', description: 'Sale of Product B' },
    ],
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      vendorAuth,
      (user) => {
        if (user) {
          setVendor(user);
        } else {
          setError('Please log in to view your wallet.');
        }
        setLoading(false);
      },
      (err) => {
        setError('Authentication error: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-600"></div>
        <p className="text-gray-600 mt-2">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-600 text-[10px] mb-4">{error}</p>
          <p className="text-gray-600">
            <Link to="/seller/login" className="text-blue-600 hover:underline">
              Return to Login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex flex-1">
        {/* Toggle button for mobile */}
        <button
          className="md:hidden p-4 text-gray-600 hover:text-gray-800 focus:outline-none"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } md:block md:w-1/4 bg-gray-50 p-6 transition-all duration-300 ease-in-out`}
        >
          <SellerSidebar />
        </div>

        {/* Main content */}
        <div className="w-full md:w-3/4 p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-700">Wallet Overview</h1>
            <p className="text-sm text-gray-500">Manage your earnings and transactions.</p>
          </div>

          {/* Wallet Balance */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400">Current Balance</p>
                <p className="text-2xl font-semibold text-gray-800">₦{mockWallet.balance.toFixed(2)}</p>
              </div>
              <Link
                to="/vendor/withdraw"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Withdraw Funds
              </Link>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h3>
            {mockWallet.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3 px-6">Date</th>
                      <th scope="col" className="py-3 px-6">Type</th>
                      <th scope="col" className="py-3 px-6">Amount</th>
                      <th scope="col" className="py-3 px-6">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockWallet.transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-4 px-6">{transaction.date}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`${
                              transaction.type === 'Credit' ? 'text-green-500' : 'text-red-500'
                            } font-medium`}
                          >
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-4 px-6">₦{transaction.amount.toFixed(2)}</td>
                        <td className="py-4 px-6">{transaction.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No transactions found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}