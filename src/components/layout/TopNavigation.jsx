import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const TopNavigation = () => {
  const [hoveredLink, setHoveredLink] = useState(null);

  const links = [
    { name: 'Help & Support', path: '/support' },
    { name: 'FAQ', path: '/support?tab=faq' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms & Conditions', path: '/terms-conditions' }
  ];

  return (
    <div className="bg-gray-100 py-2 border-b border-gray-200 mt-16 sm:mt-8 md:mt-4 lg:mt-0 -mb-8 lg:mb-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-end items-center text-[10px] sm:text-xs md:text-sm">
          {links.map((link, index) => (
            <div // Changed from motion.div to div
              key={index}
              // Removed: whileHover={{ y: -2 }}
              className="ml-4 first:ml-0 relative"
            >
              <Link
                to={link.path}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200" // This is the desired hover effect (text color change)
                onMouseEnter={() => setHoveredLink(index)} // These are still needed if you plan to re-introduce the underline later
                onMouseLeave={() => setHoveredLink(null)}  // but harmless if not used now.
              >
                {link.name}
              </Link>
            </div>
          ))}

          <div className="ml-6 flex items-center text-gray-600"> {/* Changed from motion.div to div */}
            <Link to="/sell" className="flex items-center hover:text-blue-600 transition-colors duration-200"> {/* This is the desired hover effect (text color change) */}
              <i className="bx bx-store-alt mr-1"></i>
              <span>Sell on Foremade</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;