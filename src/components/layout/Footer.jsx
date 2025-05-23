import { Link } from 'react-router-dom';
import ngFlag from '/src/assets/nglogo.png';
import ukFlag from '/src/assets/uklogo.png';

const Footer = () => {
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
      <div className="bg-white text-gray-800 py-8">
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
              <div className="flex space-x-4 items-center">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-xl hover:text-blue-400">
                  <i className="bx bxl-twitter"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-xl hover:text-pink-400">
                  <i className="bx bxl-instagram"></i>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-xl hover:text-blue-600">
                  <i className="bx bxl-facebook"></i>
                </a>

                <div className="relative group m-4">
                  <button className="hover:text-blue-600 flex items-center">
                    <img src={ukFlag} alt="ng-flag" className="h-5" />
                    <i className="bx bx-chevron-down ml-1"></i>
                  </button>
                  <div className="absolute hidden group-hover:block bg-gray-300 z-10 w-48 rounded-md shadow-xl">
                    <span className="block px-4 py-1 text-xs hover:text-black">
                      <img src={ngFlag} alt="uk-flag" className="h-5" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Hotline */}
              <div className="flex items-center space-x-2">
                <i className="bx bx-phone text-xl"></i>
                <span>Hotline</span>
              </div>

              {/* Contact Info */}
              <p>United Kingdom</p>
              <p>info@foremade.com</p>
            </div>

            {/* Accounts Column */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Accounts</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/profile" className="hover:text-blue-400">Profile</Link>
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
                  <Link to="/privacy-policy" className="hover:text-blue-400">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms-conditions" className="hover:text-blue-400">Terms & Conditions</Link>
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