import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorAuth } from '../firebase';
import { signOut } from 'firebase/auth';
import logo from '../assets/logi.png';

export default function SellerSidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(vendorAuth);
      navigate('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleProductsDropdown = () => {
    setIsProductsDropdownOpen(!isProductsDropdownOpen);
  };

  return (
    <>
      {/* Hamburger Menu Button (Mobile Only) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
        onClick={toggleSidebar}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-black flex flex-col z-50 md:w-64 md:flex md:flex-col transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <img src={logo} alt="Foremade logo" className="w-40" />
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
            className="w-full p-2 rounded-lg bg-slate-400 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block p-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-slate-700">
            <i className="bx bx-home text-lg mr-2"></i>Dashboard
          </Link>
          <div>
            <h3 className="text-xs uppercase text-gray-400 px-2 mb-1">Order Management</h3>
            <Link to="/sellers/orders" onClick={() => setIsOpen(false)} className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-slate-700">
              <i className="bx bx-cart text-lg mr-2"></i>Orders
            </Link>
          </div>
          <div>
            <h3 className="text-xs uppercase text-gray-400 px-2 mb-1">Product Management</h3>
            <div>
              <button
                onClick={toggleProductsDropdown}
                className="flex items-center p-2 rounded-lg text-gray-200 w-full text-left hover:bg-slate-700"
              >
                <i className="bx bx-box text-lg mr-2"></i>Products
                <i className={`bx ${isProductsDropdownOpen ? 'bx-chevron-up' : 'bx-chevron-down'} ml-auto text-sm`}></i>
              </button>
              {isProductsDropdownOpen && (
                <div className="ml-6 space-y-1 mt-1">
                  <Link to="/sellers/products" onClick={() => setIsOpen(false)} className="block p-1 rounded-lg text-gray-200 hover:bg-slate-600">
                    <i className="bx bx-list-ul text-lg mr-2"></i>Products List
                  </Link>
                  <Link to="/products-gallery" onClick={() => setIsOpen(false)} className="block p-1 rounded-lg text-gray-200 hover:bg-slate-600">
                    <i className="bx bx-image-alt text-lg mr-2"></i>Products Gallery
                  </Link>
                  <Link to="/products-upload" onClick={() => setIsOpen(false)} className="block p-1 rounded-lg text-gray-200 hover:bg-slate-600">
                    <i className="bx bx-upload text-lg mr-2"></i>Upload Products
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase text-gray-400 px-2 mb-1">Help & Support</h3>
            <Link to="/inbox" onClick={() => setIsOpen(false)} className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-slate-700">
              <i className="bx bx-message text-lg mr-2"></i>Inbox
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors duration-200"
          >
            <i className="bx bx-log-out text-lg mr-2"></i>Sign Out
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

      {/* Custom Styles for Fancy Scrollbar */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #4b5563; /* Slate gray track */
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #93c5fd; /* Light blue thumb */
            border-radius: 3px;
            transition: background 0.3s;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #60a5fa; /* Brighter blue on hover */
          }
          .custom-scrollbar {
            scrollbar-width: thin; /* Firefox */
            scrollbar-color: #93c5fd #4b5563; /* Thumb and track for Firefox */
          }
        `}
      </style>
    </>
  );
}