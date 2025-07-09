import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store } from 'lucide-react';
import CurrencyConverter from './CurrencyConverter';

const TopNavigation = () => {
  const [hoveredLink, setHoveredLink] = useState(null);

  const links = [
    { name: 'Help & Support', path: '/support' },
    { name: 'FAQ', path: '/support?tab=faq' },
  ];

  return (
    <div className="bg-gray-100 py-2 border-b border-gray-200 mt-16 sm:mt-8 md:mt-4 lg:mt-0 -mb-8 lg:mb-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-end items-center text-[10px] sm:text-xs md:text-sm">
          {links.map((link, index) => (
            <div
              key={index}
              className="ml-4 first:ml-0 relative"
            >
              <Link
                to={link.path}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                onMouseEnter={() => setHoveredLink(index)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {link.name}
              </Link>
            </div>
          ))}

          <div className="ml-6 flex items-center text-gray-600">
            <Link to="/sell" className="flex items-center hover:text-blue-600 transition-colors duration-200">
              <Store className="w-4 h-4 mr-1" />
              <span>Sell on Foremade</span>
            </Link>
          </div>

          <div className="ml-4 flex items-center">
            <CurrencyConverter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;