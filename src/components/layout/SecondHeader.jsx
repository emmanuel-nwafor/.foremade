import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '/src/firebase';
import logo from '/src/assets/logi.png';

export default function SecondHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const user = auth.currentUser;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: 'bx-home' },
    { to: '/products', label: 'Products', icon: 'bx-box' },
    { to: '/orders', label: 'Orders', icon: 'bx-cart' },
    { to: user ? '/profile' : '/login', label: user ? 'Profile' : 'Login', icon: user ? 'bx-user' : 'bx-log-in' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 rounded-lg overflow-hidden">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Foremade logo" className="h-10 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-800 text-white'
                }`}
                aria-label={link.label}
              >
                <span className="flex items-center">
                  <i className={`bx ${link.icon} mr-1`}></i>
                  {link.label}
                </span>
                {location.pathname === link.to && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-blue-500"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white hover:text-blue-400"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <i className={`bx ${isMobileMenuOpen ? 'bx-x' : 'bx-menu'} text-2xl`}></i>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden bg-gray-900 border-t border-gray-800">
            <div className="px-4 py-2">
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-800 text-white'
                    }`}
                    aria-label={link.label}
                  >
                    <span className="flex items-center">
                      <i className={`bx ${link.icon} mr-1`}></i>
                      {link.label}
                    </span>
                    {location.pathname === link.to && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-blue-500"></span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}