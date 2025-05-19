import React, { useState } from 'react';
import SellerSidebar from './SellerSidebar';
import Overview from './Overview';
import Wallet from './Wallet';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-white">
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
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } md:block md:w-64 bg-blue-900 text-white flex flex-col z-50 transition-all duration-300 ease-in-out`}
        >
          <SellerSidebar />
        </div>

        {/* Main content */}
        <div className="w-full md:w-3/4 p-6">
          <Overview />
          <Wallet />
        </div>
      </div>
    </div>
  );
}