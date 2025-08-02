import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-2xl">
                <i className="bx bx-store text-4xl text-blue-600"></i>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-xl text-blue-100">Shop. Sell. Smile.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Welcome to <strong className="text-blue-600">FOREMADE Marketplace</strong> — the people-first platform where <em>everyone can shop, sell, and smile</em>.<br/>
                Whether you're clearing out the old, launching something new, or simply looking to buy smart, FOREMADE gives you the tools, the platform, and the audience.
              </p>
            </div>

            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                We're <strong className="text-blue-600">not just another marketplace</strong>. FOREMADE was created to <strong>level the playing field</strong> — giving everyday people, creatives, and entrepreneurs a <strong>free, secure space to sell</strong> new or used products and reach buyers everywhere.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <i className="bx bx-star text-2xl text-yellow-500 mr-3"></i>
                What Makes Us Different?
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: 'bx-gift', title: 'Free to Sell', desc: 'List your items at no cost — new, handmade, or preloved.' },
                  { icon: 'bx-money', title: 'Get Paid Fast', desc: 'Sellers receive full payment after confirmed deliveries. No delays.' },
                  { icon: 'bx-mobile', title: 'User-Friendly Platform', desc: 'Designed to be mobile-first, easy to use, and built with sellers in mind.' },
                  { icon: 'bx-globe', title: 'Worldwide Reach', desc: 'Buy or sell across cities, countries, and continents.' },
                  { icon: 'bx-shield', title: 'Safe & Secure', desc: 'Protected payments, verified vendors, and encrypted data.' },
                  { icon: 'bx-check-shield', title: 'Zero Tolerance for Fraud', desc: 'Robust anti-money laundering and transaction monitoring systems.' },
                  { icon: 'bx-truck', title: 'Fast, Discounted Delivery', desc: 'Reliable logistics and savings on bundled shipments.' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="text-blue-600 flex items-center justify-center w-8">
                      <i className={`bx ${feature.icon} text-2xl`}></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <i className="bx bx-globe text-2xl text-green-600 mr-3"></i>
                For Everyone. Open to the World.
              </h2>
              <p className="text-gray-700 leading-relaxed">
                FOREMADE empowers sellers from all walks of life to connect with a growing global marketplace. Whether you're a student with a side hustle or a brand ready to scale, we help you get noticed — and get paid.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
              <p className="text-gray-800 font-semibold mb-2">
                Shop what you love. Sell what you have. To your neighborhood — or across borders. And always, smile.
              </p>
              <p className="text-gray-600 italic">
                Because on FOREMADE, everyone is a seller, and everyone is a customer.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#112d4e] text-white rounded-lg hover:bg-[#112d4e] transition-colors"
          >
            Start Shopping
            <i className="bx bx-right-arrow-alt"></i>
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <div className="text-gray-500 text-sm">
            © 2025 Foremade Global. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AboutUs;
