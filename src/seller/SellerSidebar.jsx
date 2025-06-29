import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logi.png';
import debounce from 'lodash.debounce';

export default function SellerSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleProductsDropdown = () => {
    setIsProductsDropdownOpen(!isProductsDropdownOpen);
  };

  const toggleRegisterDropdown = () => {
    setIsRegisterDropdownOpen(!isRegisterDropdownOpen);
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  // Menu items for filtering
  const menuItems = [
    { 
      to: '/dashboard',
      label: 'Dashboard',
      icon: 'bx-home' 
    },
    { 
      to: '/sellers/orders', 
      label: 'Orders', 
      icon: 'bx-cart', 
      category: 'Order Management' 
    },
    { 
      to: '/sellers/products', 
      label: 'Products List', 
      icon: 'bx-list-ul', 
      category: 'Product Management', 
      dropdown: 'products' 
    },
    { 
      to: '/products-gallery', 
      label: 'Products Gallery', 
      icon: 'bx-image-alt', 
      category: 'Product Management', 
      dropdown: 'products' 
    },
    { 
      to: '/products-upload', 
      label: 'Upload Products', 
      icon: 'bx-upload', 
      category: 'Product Management', 
      dropdown: 'products' 
    },
    { 
      to: '/sellers-guide', 
      label: 'Pro Seller Onboard', 
      icon: 'bxl-product-hunt', 
      category: 'Registering with us', 
      dropdown: 'register' 
    },
    { 
      to: '/seller-onboarding', 
      label: 'Seller Onboard', 
      icon: 'bx-select-multiple', 
      category: 'Registering with us',
      dropdown: 'register' 
    },
    { 
      to: '/smile', 
      label: 'Wallet', 
      icon: 'bx-wallet', 
      category: 'Your wallet' 
    },
  ];

  // Filter menu items based on search query
  const filteredMenuItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Hamburger Menu Button (Mobile Only) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition"
        onClick={toggleSidebar}
        aria-label="Open sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col z-50 md:w-64 md:flex md:flex-col transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 max-h-[calc(100vh)] overflow-y-auto`}
      >
        {/* Logo and Close Button */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <Link to="/" onClick={() => setIsOpen(false)} aria-label="Foremade homepage">
            <img src={logo} alt="Foremade logo" className="w-32" />
          </Link>
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 sticky top-0 bg-gray-800 z-10">
          <input
            type="text"
            placeholder="Search menu..."
            onChange={handleSearchChange}
            className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            aria-label="Search menu items"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-3">
          {searchQuery && filteredMenuItems.length === 0 ? (
            <p className="text-gray-400 text-sm px-2">No menu items found</p>
          ) : (
            <>
              {/* Dashboard */}
              {filteredMenuItems.some((item) => item.to === '/dashboard') && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center p-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-blue-600 transition"
                  aria-label="Dashboard"
                >
                  <i className="bx bx-home text-lg mr-2"></i>
                  Dashboard
                </Link>
              )}

              {/* Order Management */}
              {filteredMenuItems.some((item) => item.category === 'Order Management') && (
                <div>
                  <h3 className="text-xs uppercase text-gray-400 px-2 mb-2">Order Management</h3>
                  {filteredMenuItems
                    .filter((item) => item.category === 'Order Management')
                    .map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-gray-700 transition"
                        aria-label={item.label}
                      >
                        <i className={`bx ${item.icon} text-lg mr-2`}></i>
                        {item.label}
                      </Link>
                    ))}
                </div>
              )}

              {/* Product Management */}
              {filteredMenuItems.some((item) => item.category === 'Product Management') && (
                <div>
                  <h3 className="text-xs uppercase text-gray-400 px-2 mb-2">Product Management</h3>
                  <button
                    onClick={toggleProductsDropdown}
                    className="flex items-center p-2 rounded-lg text-gray-200 w-full text-left hover:bg-gray-700 transition"
                    aria-expanded={isProductsDropdownOpen}
                    aria-label="Toggle Products menu"
                  >
                    <i className="bx bx-box text-lg mr-2"></i>
                    Products
                    <i
                      className={`bx ${isProductsDropdownOpen ? 'bx-chevron-up' : 'bx-chevron-down'} ml-auto text-sm transition-transform duration-200`}
                    ></i>
                  </button>
                  <div
                    className={`ml-6 space-y-1 mt-1 overflow-hidden transition-all duration-200 ${
                      isProductsDropdownOpen ? 'max-h-40' : 'max-h-0'
                    }`}
                  >
                    {filteredMenuItems
                      .filter((item) => item.dropdown === 'products')
                      .map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center p-1 rounded-lg text-gray-200 hover:bg-gray-600 transition"
                          aria-label={item.label}
                        >
                          <i className={`bx ${item.icon} text-lg mr-2`}></i>
                          {item.label}
                        </Link>
                      ))}
                  </div>
                </div>
              )}

              {/* Registering with us */}
              {filteredMenuItems.some((item) => item.category === 'Registering with us') && (
                <div>
                  <h3 className="text-xs uppercase text-gray-400 px-2 mb-2">Registering with us</h3>
                  <button
                    onClick={toggleRegisterDropdown}
                    className="flex items-center p-2 rounded-lg text-gray-200 w-full text-left hover:bg-gray-700 transition"
                    aria-expanded={isRegisterDropdownOpen}
                    aria-label="Toggle Register menu"
                  >
                    <i className="bx bx-registered text-lg mr-2"></i>
                    Register
                    <i
                      className={`bx ${isRegisterDropdownOpen ? 'bx-chevron-up' : 'bx-chevron-down'} ml-auto text-sm transition-transform duration-200`}
                    ></i>
                  </button>
                  <div
                    className={`ml-6 space-y-1 mt-1 overflow-hidden transition-all duration-200 ${
                      isRegisterDropdownOpen ? 'max-h-40' : 'max-h-0'
                    }`}
                  >
                    {filteredMenuItems
                      .filter((item) => item.dropdown === 'register')
                      .map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center p-1 rounded-lg text-gray-200 hover:bg-gray-600 transition"
                          aria-label={item.label}
                        >
                          <i className={`bx ${item.icon} text-lg mr-2`}></i>
                          {item.label}
                        </Link>
                      ))}
                  </div>
                </div>
              )}

              {/* Your wallet */}
              {filteredMenuItems.some((item) => item.category === 'Your wallet') && (
                <div>
                  <h3 className="text-xs uppercase text-gray-400 px-2 mb-2">Your wallet</h3>
                  {filteredMenuItems
                    .filter((item) => item.category === 'Your wallet')
                    .map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-gray-700 transition"
                        aria-label={item.label}
                      >
                        <i className={`bx ${item.icon} text-lg mr-2`}></i>
                        {item.label}
                      </Link>
                    ))}
                </div>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Overlay (Mobile Only, when sidebar is open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
}