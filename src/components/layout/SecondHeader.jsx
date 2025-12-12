import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SecondHeader = () => {
  const location = useLocation();

  return (
  <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-40">
        <Link
          to="/"
          className={`flex flex-col items-center ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-home-alt text-2xl"></i>
          <span className="text-xs">Home</span>
        </Link>
        <Link
          to="/search"
          className={`flex flex-col items-center ${location.pathname === '/search' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-search text-2xl"></i>
          <span className="text-xs">Search</span>
        </Link>
        <Link
          to="/products-upload"
          className={`flex flex-col items-center ${location.pathname === '/products-upload' ? 'text-blue-600' : 'text-orange-500'} hover:text-amber-500`}
        >
          <i className="bx bxs-plus-circle text-2xl"></i>
          <span className="text-xs">Sell</span>
        </Link>
        <Link
          to="/notifications"
          className={`flex flex-col items-center relative ${location.pathname === '/notifications' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-bell text-2xl"></i>
          <span className="text-xs">Inbox</span>
        </Link>
        <Link
          to="/profile"
          className={`flex flex-col items-center ${location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-user text-2xl"></i>
          <span className="text-xs">You</span>
        </Link>
      </nav>
  );
};

export default SecondHeader;