import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function SecondHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/projects', label: 'Projects' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black text-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-center h-14 rounded-full overflow-hidden bg-black">
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'relative text-white'
                    : 'hover:bg-gray-800 text-white'
                }`}
                aria-label={link.label}
              >
                {link.label}
                {location.pathname === link.to && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-blue-500 rounded-full opacity-75 blur-sm"></span>
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
          <nav className="md:hidden bg-black border-t border-gray-800">
            <div className="px-4 py-2">
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      location.pathname === link.to
                        ? 'relative text-white'
                        : 'hover:bg-gray-800 text-white'
                    }`}
                    aria-label={link.label}
                  >
                    {link.label}
                    {location.pathname === link.to && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-blue-500 rounded-full opacity-75 blur-sm"></span>
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