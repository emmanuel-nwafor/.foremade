import React, { useState } from 'react';
import SellerSidebar from './SellerSidebar';
import SellerOnboardModal from './SellerOnboardModal';
import { Link } from 'react-router-dom';

export default function Wallet() {
  const [loading, setLoading] = useState(true);
  const isOnboarded = false; // Change to true or fetch from Firestore for real check

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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

  if (!isOnboarded) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-1">
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-200 text-gray-700 rounded-lg dark:bg-gray-800 dark:text-gray-300"
        >
          <i className="bx bx-menu text-xl"></i>
        </button>

        <div className="hidden md:block md:w-64 lg:w-72 bg-gray-100 dark:bg-gray-800 transition-all duration-300">
          <SellerSidebar />
        </div>

        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-full mx-auto">
            <div className="mb-4 md:mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <i className="bx bx-wallet text-2xl"></i>
                Smile Wallet
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-semibold opacity-90">Available Earnings</h3>
                <p className="text-4xl font-bold mt-1 md:mt-2">₦0.00</p>
                <p className="text-xs sm:text-sm mt-1 md:mt-2 opacity-75">Last updated: --</p>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="mt-2 sm:mt-4 bg-white text-blue-600 px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 transition-colors"
                >
                  Withdraw Earnings
                </button>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 sm:p-6 text-white">
                <h3 className="text-base sm:text-lg font-semibold opacity-90">Pending Earnings</h3>
                <p className="text-4xl font-bold mt-1 md:mt-2">₦0.00</p>
                <p className="text-xs sm:text-sm mt-1 md:mt-2 opacity-75">Earnings from recent sales awaiting processing</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Sales Transactions</h2>
              </div>
              <div className="block sm:hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex justify-between max-md:text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                    <span className="text-gray-900 dark:text-white">--</span>
                  </div>
                  <div className="flex justify-between mt-1 max-md:text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                    <span className="text-gray-900 dark:text-white">--</span>
                  </div>
                  <div className="flex justify-between mt-1 max-md:text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                    <span className="text-gray-900 dark:text-white max-md:text-xs">--</span>
                  </div>
                  <div className="flex justify-between mt-1 max-md:text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                    <span className="text-gray-900 dark:text-white">₦0.00</span>
                  </div>
                  <div className="flex justify-between mt-1 max-md:text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      --
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">--</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">--</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">--</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">₦0.00</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          --
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SellerOnboardModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Earnings"
        message="Account: [Bank Name] - [Account Number]"
        primaryAction={{ label: "Withdraw", link: "#" }}
        secondaryAction={{ label: "Cancel" }}
      />
    </div>
  );
}