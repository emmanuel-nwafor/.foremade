import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorAuth } from '../firebase';
import { signOut } from 'firebase/auth';
import logo from '../assets/logo.png';

export default function SellerSidebar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
        onClick={toggleSidebar}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gray-100 text-gray-800 flex flex-col z-50 md:w-64 md:flex md:flex-col transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-300 flex justify-between items-center">
          <img src={logo} alt="Foremade logo" className="w-32" />
          {/* Close Button (Mobile Only) */}
          <button className="md:hidden p-2" onClick={toggleSidebar}>
            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/overview" onClick={() => setIsOpen(false)}>
            <button className="flex items-center w-full text-left p-2 rounded-lg transition-colors duration-200 text-gray-500 font-semibold hover:bg-gray-200">
              <i className='bx bx-list-ol text-xl'></i>Overview
            </button>
          </Link>
          <Link to="/customers-orders" onClick={() => setIsOpen(false)}>
            <button className="flex items-center w-full text-left text-gray-500 p-2 rounded-lg transition-colors duration-200 font-semibold hover:bg-gray-200">
              <i className='bx bxs-notification text-xl'></i>Orders
            </button>
          </Link>
          <Link to="/seller-product-upload" onClick={() => setIsOpen(false)}>
            <button className="flex items-center w-full text-left text-gray-500 p-2 rounded-lg transition-colors duration-200 font-semibold hover:bg-gray-200">
              <i className='bx bx-podcast text-xl'></i>Products
            </button>
          </Link>
          <Link to="/settings" onClick={() => setIsOpen(false)}>
            <button className="flex items-center w-full text-left text-gray-500 p-2 rounded-lg transition-colors duration-200 font-semibold hover:bg-gray-200">
              <i className='bx bx-cog text-xl'></i>Settings
            </button>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-300">
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
    </>
  );
}