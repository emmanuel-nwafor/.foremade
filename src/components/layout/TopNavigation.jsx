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
    <div className="bg-gray-100 py-2 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-end items-center text-xs sm:text-sm">
          {links.map((link, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -2 }}
              className="ml-4 first:ml-0 relative"
            >
              <Link 
                to={link.path}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                onMouseEnter={() => setHoveredLink(index)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {link.name}
                <motion.span 
                  className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: hoveredLink === index ? '100%' : 0 }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            </motion.div>
          ))}
          
          <motion.div className="ml-6 flex items-center text-gray-600" whileHover={{ scale: 1.05 }}>
            <Link to="/sell" className="flex items-center hover:text-blue-600 transition-colors duration-200">
              <i className="bx bx-store-alt mr-1"></i>
              <span>Sell on Foremade</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;