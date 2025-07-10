import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ngFlag from '/src/assets/nglogo.png';
import ukFlag from '/src/assets/uklogo.png';

const Footer = () => {
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [emailInput, setEmailInput] = useState('');

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
    accounts: [
      { name: 'Profile', url: '/profile' },
      { name: 'Help & Support', url: '/help-support' }
    ],
    quickLinks: [
      { name: 'Featured Products', url: '/products?featured=true' },
      { name: 'Top Stores', url: '/stores' },
      { name: 'Latest Products', url: '/products?latest=true' },
      { name: 'FAQ', url: '/faq' }
    ],
    other: [
      { name: 'Privacy Policy', url: '/privacy-policy' },
      { name: 'Terms & Conditions', url: '/terms-conditions' },
      { name: 'Buyer Protection Policy', url: '/buyer-protection-policy' }
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
      <div className="bg-gray-50 py-4 border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm text-gray-600">
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
                  className={`bx ${item.icon} text-xl mb-2 text-blue-500`}
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                ></motion.i>
                <p className="font-semibold">{item.title}</p>
                <p>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-white text-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Left Section: Logo, Contact, Newsletter */}
            <div className="space-y-4">
              {/* Logo */}
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <span className="text-2xl font-bold">Foremade</span>
                <motion.i
                  className="bx bx-chevron-up text-blue-500 rotate-45"
                  animate={{ rotate: 45 }}
                  whileHover={{ rotate: [45, 90, 45], scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                ></motion.i>
              </motion.div>

              {/* Social Media Icons */}
              <div className="flex space-x-4 items-center">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xl ${hoveredIcon === social.name ? social.color : 'text-gray-600'}`}
                    onMouseEnter={() => setHoveredIcon(social.name)}
                    onMouseLeave={() => setHoveredIcon(null)}
                    whileHover={{ scale: 1.2, y: -5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <i className={social.icon}></i>
                  </motion.a>
                ))}

                <div className="relative group m-4">
                  <motion.button
                    className="hover:text-blue-600 flex items-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <img src={ukFlag} alt="UK flag" className="h-5" />
                    <i className="bx bx-chevron-down ml-1"></i>
                  </motion.button>
                  <div className="absolute hidden group-hover:block bg-white z-10 w-48 rounded-md shadow-xl border border-gray-200">
                    <motion.span
                      className="block px-4 py-2 text-xs hover:bg-gray-100 cursor-pointer"
                      whileHover={{ x: 5 }}
                    >
                      <img src={ngFlag} alt="NG flag" className="h-5" />
                    </motion.span>
                  </div>
                </div>
              </div>

              {/* Hotline */}
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05, x: 5 }}
              >
                <i className="bx bx-phone text-xl text-blue-500"></i>
                <span>Hotline</span>
              </motion.div>

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p>United Kingdom</p>
                <p className="text-blue-600 hover:underline cursor-pointer">info@foremade.com</p>
              </motion.div>

              {/* Newsletter signup form */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold mb-3">Subscribe to our newsletter</h3>
                <form onSubmit={handleNewsletterSubmit} className="flex">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Your email"
                    className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                  <motion.button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className="bx bx-envelope"></i>
                  </motion.button>
                </form>
              </div>
            </div>

            {/* Accounts Column */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Accounts</h3>
              <ul className="space-y-2 text-sm">
                {footerLinks.accounts.map((link, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Link
                      to={link.url}
                      className={`hover:text-blue-400 relative inline-block ${hoveredLink === `accounts-${index}` ? 'text-blue-500' : 'text-gray-600'}`}
                      onMouseEnter={() => setHoveredLink(`accounts-${index}`)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      {link.name}
                      <motion.span
                        className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400"
                        animate={{
                          width: hoveredLink === `accounts-${index}` ? '100%' : '0%'
                        }}
                        transition={{ duration: 0.3 }}
                      ></motion.span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Quick Links Column */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {footerLinks.quickLinks.map((link, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Link
                      to={link.url}
                      className={`hover:text-blue-400 relative inline-block ${hoveredLink === `quick-${index}` ? 'text-blue-500' : 'text-gray-600'}`}
                      onMouseEnter={() => setHoveredLink(`quick-${index}`)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      {link.name}
                      <motion.span
                        className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400"
                        animate={{
                          width: hoveredLink === `quick-${index}` ? '100%' : '0%'
                        }}
                        transition={{ duration: 0.3 }}
                      ></motion.span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Other Column */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Other</h3>
              <ul className="space-y-2 text-sm">
                {footerLinks.other.map((link, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Link
                      to={link.url}
                      className={`hover:text-blue-400 relative inline-block ${hoveredLink === `other-${index}` ? 'text-blue-500' : 'text-gray-600'}`}
                      onMouseEnter={() => setHoveredLink(`other-${index}`)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      {link.name}
                      <motion.span
                        className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400"
                        animate={{
                          width: hoveredLink === `other-${index}` ? '100%' : '0%'
                        }}
                        transition={{ duration: 0.3 }}
                      ></motion.span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Section: Copyright */}
          <motion.div
            className="mt-8 text-center text-sm text-gray-400"
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