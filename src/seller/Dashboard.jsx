import React, { useState } from 'react';
import SellerSidebar from './SellerSidebar';
import SellersProducts from './SellersProducts';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex flex-1">
        {/* Toggle button for mobile */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-800 text-white rounded-lg"
          onClick={toggleSidebar}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 bg-blue-900 text-white flex flex-col z-50 transition-all duration-300 ease-in-out`}
        >
          <SellerSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview</h2>

            {/* Balance Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm">Available Balance</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">₦23,850.00</p>
                <p className="text-sm text-gray-600">Withdrawable now</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-sm">Pending Balance</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">₦30,850.00</p>
                <p className="text-sm text-gray-600">Awaiting confirmation</p>
              </div>
            </div>

            {/* Order List Section */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-sm">Pending</span>
                <p className="text-xl font-semibold text-gray-800">356</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm">Confirmed</span>
                <p className="text-xl font-semibold text-gray-800">1,485</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-sm">Processing</span>
                <p className="text-xl font-semibold text-gray-800">987</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-purple-600 bg-purple-100 px-2 py-1 rounded-full text-sm">Ready to Ship</span>
                <p className="text-xl font-semibold text-gray-800">987</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full text-sm">Canceled</span>
                <p className="text-xl font-semibold text-gray-800">21</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-sm">Delivered</span>
                <p className="text-xl font-semibold text-gray-800">987</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded-full text-sm">Returned</span>
                <p className="text-xl font-semibold text-gray-800">3</p>
              </div>
            </div>

            {/* Sales Analysis Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-600">Orders</span>
                  <p className="text-xl font-semibold text-gray-800">356 <span className="text-green-600 text-sm">+3.0%</span></p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-600">Views</span>
                  <p className="text-xl font-semibold text-gray-800">245 <span className="text-red-600 text-sm">-1.4%</span></p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-600">Conversion Rate</span>
                  <p className="text-xl font-semibold text-gray-800">1,238 <span className="text-red-600 text-sm">+0.0%</span></p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="text-gray-600">Conversions</span>
                  <p className="text-xl font-semibold text-gray-800">1,238 <span className="text-green-600 text-sm">+0.0%</span></p>
                </div>
              </div>
              <div className="h-40">
                <canvas id="salesChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}