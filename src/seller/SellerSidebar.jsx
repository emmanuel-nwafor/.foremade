import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorAuth } from '../firebase';
import { signOut } from 'firebase/auth';
import logo from '../assets/logo.png';

export default function SellerSidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    try {
      await signOut(vendorAuth);
      navigate('/seller/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hamburger Menu Button (Mobile Only) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-800 text-white rounded-lg"
        onClick={toggleSidebar}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-blue-900 text-white flex flex-col z-50 md:w-64 md:flex md:flex-col transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-4 border-b border-blue-700 flex justify-between items-center">
          <img src={logo} alt="Foremade logo" className="w-28" />
          {/* Close Button (Mobile Only) */}
          <button className="md:hidden p-2" onClick={toggleSidebar}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 rounded-lg bg-blue-800 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hidden">
          <Link to="/overview" onClick={() => setIsOpen(false)} className="block p-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700">
            <i className="bx bx-home text-lg mr-2"></i>Dashboard
          </Link>
          <div>
            <h3 className="text-xs uppercase text-gray-400 px-2 mb-1">Order Management</h3>
            <Link to="/vendor/orders" onClick={() => setIsOpen(false)} className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-blue-800">
              <i className="bx bx-cart text-lg mr-2"></i>Orders
            </Link>
            <Link to="/vendor/refund-requests" onClick={() => setIsOpen(false)} className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-blue-800">
              <i className="bx bx-receipt text-lg mr-2"></i>Refund Requests
            </Link>
          </div>
          <div>
            <h3 className="text-xs uppercase text-gray-400 px-2 mb-1">Product Management</h3>
            <Link to="/seller-product-upload" onClick={() => setIsOpen(false)} className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-blue-800">
              <i className="bx bx-box text-lg mr-2"></i>Products
            </Link>
            <Link to="/vendor/product-reviews" onClick={() => setIsOpen(false)} className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-blue-800">
              <i className="bx bx-star text-lg mr-2"></i>Product Reviews
            </Link>
          </div>
          <div>
            <h3 className="text-xs uppercase text-gray-400 px-2 mb-1">Promotion Management</h3>
            <Link to="/vendor/coupons" onClick={() => setIsOpen(false)} className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-blue-800">
              <i className="bx bx-gift text-lg mr-2"></i>Coupons
            </Link>
            <Link to="/vendor/clearance-sale" onClick={() => setIsOpen(false)} className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-blue-800">
              <i className="bx bx-megaphone text-lg mr-2"></i>Clearance Sale
            </Link>
          </div>
          <div>
            <h3 className="text-xs uppercase text-gray-400 px-2 mb-1">Help & Support</h3>
            <Link to="/vendor/inbox" onClick={() => setIsOpen(false)} className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-blue-800">
              <i className="bx bx-message text-lg mr-2"></i>Inbox
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-blue-700">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Overlay (Mobile Only, when sidebar is open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Custom Styles for Hiding Scrollbar */}
      <style>
        {`
          .scrollbar-hidden::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hidden {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `}
      </style>
    </>
  );
}