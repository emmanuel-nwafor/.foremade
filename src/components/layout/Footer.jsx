import { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      console.log('Newsletter subscription submitted:', email);
      setEmail(''); // Clear the input after submission
    }
  };

  return (
    <footer className="bg-white mt-16">
      {/* Top Section: Benefits */}
      <div className="bg-gray-50 py-4 border-t border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm text-gray-600">
            <div className="flex flex-col items-center">
              <i className="bx bxs-truck text-xl mb-2"></i>
              <p className="font-semibold">Fast Shipping</p>
              <p>Fast shipping all across the country</p>
            </div>
            <div className="flex flex-col items-center">
              <i className="bx bx-check-shield text-xl mb-2"></i>
              <p className="font-semibold">Authentic Products</p>
              <p>100% Authentic products</p>
            </div>
            <div className="flex flex-col items-center">
              <i className="bx bx-lock-alt text-xl mb-2"></i>
              <p className="font-semibold">100% Secure Payment</p>
              <p>We Ensure Secure Transactions</p>
            </div>
            <div className="flex flex-col items-center">
              <i className="bx bx-headphone text-xl mb-2"></i>
              <p className="font-semibold">24/7 Support Center</p>
              <p>We Ensure Quality Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Left Section: Logo, Contact, Newsletter */}
            <div className="space-y-4">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">Foremade</span>
                <i className="bx bx-chevron-up text-blue-500 rotate-45"></i>
              </div>

              {/* Social Media Icons */}
              <div className="flex space-x-4">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-xl hover:text-blue-400">
                  <i className="bx bxl-twitter"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-xl hover:text-pink-400">
                  <i className="bx bxl-instagram"></i>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-xl hover:text-blue-600">
                  <i className="bx bxl-facebook"></i>
                </a>
              </div>

              {/* Hotline */}
              <div className="flex items-center space-x-2">
                <i className="bx bx-phone text-xl"></i>
                <span>Hotline</span>
              </div>

              {/* Contact Info */}
              <p>Nigeria</p>
              <p>info@foremade.com</p>

              {/* Newsletter */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <span>Newsletter</span>
                  <i className="bx bx-chevron-up text-blue-500 rotate-45"></i>
                </h3>
                <p className="text-sm">Subscribe our newsletter to get latest updates</p>
                <form onSubmit={handleNewsletterSubmit} className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>

            {/* Accounts Column */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Accounts</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/open-store" className="hover:text-blue-400">Open Your Store</Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-blue-400">Profile</Link>
                </li>
                <li>
                  <Link to="/track-order" className="hover:text-blue-400">Track Order</Link>
                </li>
                <li>
                  <Link to="/help-support" className="hover:text-blue-400">Help & Support</Link>
                </li>
              </ul>
            </div>

            {/* Quick Links Column */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/products?featured=true" className="hover:text-blue-400">Featured Products</Link>
                </li>
                <li>
                  <Link to="/stores" className="hover:text-blue-400">Top Stores</Link>
                </li>
                <li>
                  <Link to="/products?latest=true" className="hover:text-blue-400">Latest Products</Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-blue-400">FAQ</Link>
                </li>
              </ul>
            </div>

            {/* Other Column */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Other</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="hover:text-blue-400">About Company</Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-blue-400">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms-conditions" className="hover:text-blue-400">Terms & Conditions</Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="hover:text-blue-400">Refund Policy</Link>
                </li>
                <li>
                  <Link to="/return-policy" className="hover:text-blue-400">Return Policy</Link>
                </li>
                <li>
                  <Link to="/cancellation-policy" className="hover:text-blue-400">Cancellation Policy</Link>
                </li>
                <li>
                  <Link to="/support-ticket" className="hover:text-blue-400">Support Ticket</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section: Copyright */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <p>&copy; Foremade, Inc.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;