import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ngFlag from '/src/assets/nglogo.png';
import ukFlag from '/src/assets/uklogo.png';

const Footer = () => {
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [emailInput, setEmailInput] = useState('');

  // Same categories as used in the header
  const categories = [
    "Television & Accessories",
    "Drinks & Beverages",
    "Game & Console",
    "Home & Living",
    "Perfumes & Fragrances",
    "Vehicles & Transport",
    "Computers & Laptops",
  ];

  const slugify = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const socialLinks = [
    { name: 'twitter', icon: 'bx bxl-twitter', color: 'text-blue-400', url: 'https://twitter.com' },
    { name: 'instagram', icon: 'bx bxl-instagram', color: 'text-pink-400', url: 'https://instagram.com' },
    { name: 'facebook', icon: 'bx bxl-facebook', color: 'text-blue-600', url: 'https://facebook.com' }
  ];

  const benefitItems = [
    { icon: 'bxs-truck', title: 'Fast Shipping', description: 'Fast shipping all across the country' },
    { icon: 'bx-check-shield', title: 'Authentic Products', description: '100% Authentic products' },
    { icon: 'bx-lock-alt', title: '100% Secure Payment', description: 'We Ensure Secure Transactions' },
    { icon: 'bx-headphone', title: '24/7 Support Center', description: 'We Ensure Quality Support' }
  ];

  const footerLinks = {
    account: [
      { name: 'My Profile', url: '/profile' },
      { name: 'My Orders', url: '/orders' },
      { name: 'My Wishlist', url: '/favorites' }
    ],
    about: [
      { name: 'About Us', url: '/about' },
      { name: 'Support', url: '/support' }
    ]
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would send this to your API
    alert(`Thanks for subscribing with ${emailInput}!`);
    setEmailInput('');
  };

  return (
    <footer className="bg-white mt-16">
      {/* Top Section: Benefits */}
      <div className="bg-gray-50 py-3 border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs text-gray-600">
            {benefitItems.map((item, index) => (
              <motion.div 
                key={index} 
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.i 
                  className={`bx ${item.icon} text-base mb-1 text-blue-500`}
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                ></motion.i>
                <p className="font-semibold text-xs">{item.title}</p>
                <p className="text-xs">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-white text-gray-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap flex-row justify-between">
            {/* Left Section: Logo and Social */}
            <div className="w-full md:w-auto mb-6 md:mb-0">
              {/* Logo */}
              <motion.div 
                className="flex items-center space-x-2 mb-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <span className="text-lg font-bold">Foremade</span>
                <motion.i 
                  className="bx bx-chevron-up text-blue-500 rotate-45"
                  animate={{ rotate: 45 }}
                  whileHover={{ rotate: [45, 90, 45], scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                ></motion.i>
              </motion.div>

              {/* Social Media Icons */}
              <div className="flex space-x-4 items-center mb-4">
                {socialLinks.map((social, index) => (
                  <motion.a 
                    key={index}
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`text-lg ${hoveredIcon === social.name ? social.color : 'text-gray-600'}`}
                    onMouseEnter={() => setHoveredIcon(social.name)}
                    onMouseLeave={() => setHoveredIcon(null)}
                    whileHover={{ scale: 1.2, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className={social.icon}></i>
                  </motion.a>
                ))}

                <div className="relative group ml-2">
                  <motion.button 
                    className="hover:text-blue-600 flex items-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <img src={ukFlag} alt="UK flag" className="h-4" />
                    <i className="bx bx-chevron-down ml-1"></i>
                  </motion.button>
                  <div className="absolute hidden group-hover:block bg-white z-10 w-36 rounded-md shadow-xl border border-gray-200">
                    <motion.span 
                      className="block px-3 py-1 text-xs hover:bg-gray-100 cursor-pointer"
                      whileHover={{ x: 3 }}
                    >
                      <img src={ngFlag} alt="NG flag" className="h-4" />
                    </motion.span>
                  </div>
                </div>
              </div>
              
              {/* Newsletter signup form */}
              <div className="mb-4 md:max-w-xs">
                <h3 className="text-xs font-semibold mb-2">Subscribe to our newsletter</h3>
                <form onSubmit={handleNewsletterSubmit} className="flex">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Your email"
                    className="flex-1 p-1 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    required
                  />
                  <motion.button
                    type="submit"
                    className="bg-blue-500 text-white px-2 py-1 rounded-r-md hover:bg-blue-600 text-xs"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className="bx bx-envelope"></i>
                  </motion.button>
                </form>
              </div>
            </div>

            {/* Footer Link Columns - Arranged side by side on mobile */}
            <div className="flex flex-wrap w-full md:w-auto justify-between">
              {/* Categories Column */}
              <div className="w-1/3 pr-2">
                <h3 className="text-sm font-semibold mb-2">Categories</h3>
                <ul className="space-y-1 text-xs">
                  {categories.slice(0, 8).map((category, index) => (
                    <motion.li 
                      key={index}
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Link 
                        to={`/category/${slugify(category)}`}
                        className={`hover:text-blue-400 relative inline-block ${hoveredLink === `category-${index}` ? 'text-blue-500' : 'text-gray-600'}`}
                        onMouseEnter={() => setHoveredLink(`category-${index}`)}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                        {category}
                        <motion.span 
                          className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400"
                          animate={{ 
                            width: hoveredLink === `category-${index}` ? '100%' : '0%'
                          }}
                          transition={{ duration: 0.3 }}
                        ></motion.span>
                      </Link>
                    </motion.li>
                  ))}
                  {/* Show "More Categories" link if there are more than 8 categories */}
                  {categories.length > 8 && (
                    <motion.li 
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Link 
                        to="/products"
                        className={`hover:text-blue-400 relative inline-block ${hoveredLink === 'more-categories' ? 'text-blue-500' : 'text-gray-600'}`}
                        onMouseEnter={() => setHoveredLink('more-categories')}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                        More Categories...
                        <motion.span 
                          className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400"
                          animate={{ 
                            width: hoveredLink === 'more-categories' ? '100%' : '0%'
                          }}
                          transition={{ duration: 0.3 }}
                        ></motion.span>
                      </Link>
                    </motion.li>
                  )}
                </ul>
              </div>

              {/* Account Column */}
              <div className="w-1/3 px-2">
                <h3 className="text-sm font-semibold mb-2">Account</h3>
                <ul className="space-y-1 text-xs">
                  {footerLinks.account.map((link, index) => (
                    <motion.li 
                      key={index}
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Link 
                        to={link.url} 
                        className={`hover:text-blue-400 relative inline-block ${hoveredLink === `account-${index}` ? 'text-blue-500' : 'text-gray-600'}`}
                        onMouseEnter={() => setHoveredLink(`account-${index}`)}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                        {link.name}
                        <motion.span 
                          className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400"
                          animate={{ 
                            width: hoveredLink === `account-${index}` ? '100%' : '0%'
                          }}
                          transition={{ duration: 0.3 }}
                        ></motion.span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* About Column */}
              <div className="w-1/3 pl-2">
                <h3 className="text-sm font-semibold mb-2">About</h3>
                <ul className="space-y-1 text-xs">
                  {footerLinks.about.map((link, index) => (
                    <motion.li 
                      key={index}
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Link 
                        to={link.url} 
                        className={`hover:text-blue-400 relative inline-block ${hoveredLink === `about-${index}` ? 'text-blue-500' : 'text-gray-600'}`}
                        onMouseEnter={() => setHoveredLink(`about-${index}`)}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                        {link.name}
                        <motion.span 
                          className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400"
                          animate={{ 
                            width: hoveredLink === `about-${index}` ? '100%' : '0%'
                          }}
                          transition={{ duration: 0.3 }}
                        ></motion.span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Section: Copyright */}
          <motion.div 
            className="mt-6 text-center text-xs text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p>&copy; {new Date().getFullYear()} Foremade, Inc. All rights reserved.</p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;