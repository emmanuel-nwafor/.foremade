import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingCart, List, Image, Upload, Award, CheckSquare, Wallet, MessageSquare, Menu, X, Package, TrendingUp } from 'lucide-react';
import logo from '../assets/logi.png';
import debounce from 'lodash.debounce';

export default function SellerSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Home, category: 'Dashboard' },
    { to: '/sellers/orders', label: 'Orders', icon: ShoppingCart, category: 'Order Management' },
    { to: '/sellers/products', label: 'Products List', icon: List, category: 'Product Management' },
    { to: '/products-gallery', label: 'Products Gallery', icon: Image, category: 'Product Management' },
    { to: '/products-upload', label: 'Upload Products', icon: Upload, category: 'Product Management' },
    { to: '/product-bump', label: 'Product Bump', icon: Package, category: 'Product Management' },
    { to: '/pro-seller-analytics', label: 'Pro Analytics', icon: TrendingUp, category: 'Product Management' },
    { to: '/pro-seller-guide', label: 'Pro Seller', icon: Award, category: 'Registering with us' },
    { to: '/seller-onboarding', label: 'Standard Seller', icon: CheckSquare, category: 'Registering with us' },
    { to: '/smile', label: 'Wallet', icon: Wallet, category: 'Your wallet' },
    { to: '/seller-transactions', label: 'Transactions', icon: TrendingUp, category: 'Your wallet' },
    { to: '/seller-chat', label: 'Chats', icon: MessageSquare, category: 'Chat' },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 text-black bg-blue-900 rounded-lg hover:bg-blue-900 transition"
        onClick={toggleSidebar}
        aria-label="Open sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col z-50 md:w-64 md:flex md:flex-col transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 max-h-[calc(100vh)] overflow-y-auto`}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <Link to="/" onClick={() => setIsOpen(false)} aria-label="Foremade homepage">
            <img src={logo} alt="Foremade logo" className="w-32" />
          </Link>
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sticky top-0 bg-gray-800 z-10">
          <input
            type="text"
            placeholder="Search menu..."
            onChange={handleSearchChange}
            className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            aria-label="Search menu items"
          />
        </div>

        <nav className="flex-1 p-2 space-y-3">
          {searchQuery && filteredMenuItems.length === 0 ? (
            <p className="text-gray-400 text-sm px-2">No menu items found</p>
          ) : (
            <>
              {filteredMenuItems.some((item) => item.category === 'Dashboard') && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center p-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition"
                  aria-label="Dashboard"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Dashboard
                </Link>
              )}

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
                        <item.icon className="w-5 h-5 mr-2" />
                        {item.label}
                      </Link>
                    ))}
                </div>
              )}

              {filteredMenuItems.some((item) => item.category === 'Product Management') && (
                <div>
                  <h3 className="text-xs uppercase text-gray-400 px-2 mb-2">Product Management</h3>
                  {filteredMenuItems
                    .filter((item) => item.category === 'Product Management')
                    .map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-gray-700 transition"
                        aria-label={item.label}
                      >
                        <item.icon className="w-5 h-5 mr-2" />
                        {item.label}
                      </Link>
                    ))}
                </div>
              )}

              {filteredMenuItems.some((item) => item.category === 'Registering with us') && (
                <div>
                  <h3 className="text-xs uppercase text-gray-400 px-2 mb-2">Registering with us</h3>
                  {filteredMenuItems
                    .filter((item) => item.category === 'Registering with us')
                    .map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-gray-700 transition"
                        aria-label={item.label}
                      >
                        <item.icon className="w-5 h-5 mr-2" />
                        {item.label}
                      </Link>
                    ))}
                </div>
              )}

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
                        <item.icon className="w-5 h-5 mr-2" />
                        {item.label}
                      </Link>
                    ))}
                </div>
              )}

              {filteredMenuItems.some((item) => item.category === 'Chat') && (
                <div>
                  <h3 className="text-xs uppercase text-gray-400 px-2 mb-2">Chat</h3>
                  {filteredMenuItems
                    .filter((item) => item.category === 'Chat')
                    .map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center p-2 rounded-lg text-gray-200 hover:bg-gray-700 transition"
                        aria-label={item.label}
                      >
                        <item.icon className="w-5 h-5 mr-2" />
                        {item.label}
                      </Link>
                    ))}
                </div>
              )}
            </>
          )}
        </nav>
      </div>

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