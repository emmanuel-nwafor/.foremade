import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import bgImage from '../assets/images/bg.jpg';
import sellerImage1 from '../assets/images/1.png';
import sellerImage2 from '../assets/images/3.png';
import sellerImage3 from '../assets/images/2.png';
import { Link } from 'react-router-dom';

export default function ProSellerGuide() {
  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col">
      {/* Custom styles for arrow border and fold effect */}
      <style>{`
        .arrow-border {
          clip-path: polygon(0% 10%, 50% 10%, 50% 0%, 100% 50%, 50% 100%, 50% 90%, 0% 90%);
          box-shadow: 0 4px 24px 0 rgba(0,0,0,0.08);
          background: white;
        }
        .fold-effect {
          /* Optionally add a slight transform for the fold effect */
          box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18);
          z-index: 2;
        }
        .sway {
          animation: sway-left-right 2.2s ease-in-out infinite alternate;
        }
        @keyframes sway-left-right {
          0% { transform: translateX(0); }
          50% { transform: translateX(10px); }
          100% { transform: translateX(0); }
        }
        .learn-more-anim {
          transition: background 0.3s, color 0.3s, transform 0.3s;
        }
        .learn-more-anim:hover {
          background: #f59e42;
          color: #fff;
          transform: scale(1.07) translateY(-2px);
        }
        .learn-more-anim .arrow-anim {
          transition: transform 0.3s;
        }
        .learn-more-anim:hover .arrow-anim {
          transform: translateX(8px) scale(1.2) rotate(8deg);
        }
        .register-anim {
          transition: background 0.3s, box-shadow 0.3s, transform 0.3s;
        }
        .register-anim:hover {
          background: linear-gradient(90deg, #1e3a8a 0%, #7c3aed 100%);
          box-shadow: 0 8px 32px 0 rgba(245,158,66,0.18);
          transform: scale(1.06) translateY(-2px);
        }
        .register-anim .arrow-anim {
          transition: transform 0.3s;
        }
        .register-anim:hover .arrow-anim {
          transform: translateX(8px) scale(1.2) rotate(8deg);
        }
      `}</style>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url(${bgImage})`
        }}
      />
      {/* Right-side visual (empty for now, can add more decor if needed) */}
      <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-end pr-8 pointer-events-none select-none">
        {/* Decorative area, can add more visuals here if desired */}
      </div>
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-6xl mx-auto px-4 py-12 w-full">
        {/* Header Section */}
        <div className="mb-12 max-w-2xl lg:ml-0 ml-0">
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-purple-900 text-white p-10 md:p-16 rounded-2xl shadow-2xl flex flex-col items-start">
            <h1 className="text-orange-400 text-4xl md:text-5xl font-extrabold mb-4 self-start">Foremade Pro Seller</h1>
            <div className="flex items-center text-lg md:text-xl">
              <span>Grow Your Business With Ease</span>
              <Link to="/pro-seller-form" className="ml-4 flex items-center group">
                <ChevronRight className="w-8 h-8 animate-pulse text-yellow-300 group-hover:text-orange-400 transition-colors duration-200 sway" />
                <ChevronRight className="w-8 h-8 animate-pulse delay-75 text-yellow-300 group-hover:text-orange-400 transition-colors duration-200 sway" />
                <ChevronRight className="w-8 h-8 animate-pulse delay-150 text-yellow-300 group-hover:text-orange-400 transition-colors duration-200 sway" />
              </Link>
            </div>
          </div>
        </div>
        {/* Main Content - wider than header */}
        <div className="mb-12 max-w-4xl lg:ml-0 ml-0">
          <div className="bg-white rounded-2xl shadow-2xl p-10 md:p-16 w-full">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">
              WHO CAN REGISTER AS A PRO SELLER?
            </h2>
            <div className="mb-8">
              <p className="text-gray-700 text-lg leading-relaxed">
                Are you a manufacturer, trader, brand, or retail business looking 
                to expand your reach and grow your customer base? Become a 
                FOREMADE Pro Seller and gain access to advanced features, 
                dedicated support, and increased visibility.
              </p>
            </div>
            <div className="space-y-6 mb-8">
              <div className="hover:bg-blue-50 p-4 rounded transition-colors duration-200">
                <h3 className="font-semibold text-blue-900 text-lg mb-2">1. New to FOREMADE?</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Sign up directly through the FOREMADE Pro Seller registration page.
                </p>
              </div>
              <div className="hover:bg-blue-50 p-4 rounded transition-colors duration-200">
                <h3 className="font-semibold text-blue-900 text-lg mb-2">2. Already have a FOREMADE account?</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  You can upgrade your existing seller account to a Pro account once all 
                  current orders are fulfilled.
                </p>
              </div>
              <div className="hover:bg-blue-50 p-4 rounded transition-colors duration-200">
                <h3 className="font-semibold text-blue-900 text-lg mb-2">3. Need both personal and business accounts?</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  No problem! You're welcome to have one standard account and one Pro 
                  account - just use a different email and phone number for your Pro 
                  registration.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/pro-seller-guide-full" className="learn-more-anim group text-orange-500 text-lg font-semibold px-6 py-2 rounded-full border border-orange-200 shadow hover:shadow-lg flex items-center justify-end w-fit">
                <span className="flex items-center justify-center">
                  Learn more
                  <ArrowRight className="ml-2 w-5 h-5 arrow-anim group-hover:text-white transition-transform duration-200 sway" />
                </span>
              </Link>
            </div>
          </div>
        </div>
        {/* Seller Images Row - always below main content, fills width, responsive */}
        <div className="flex flex-col items-center justify-center w-full gap-8 -mt-11 -mb-4">
          <div className="flex flex-row items-end justify-start gap-8 w-full">
            <div className="w-48 h-48 md:w-52 md:h-52 lg:w-72 lg:h-72 rounded-full shadow-lg bg-white flex items-center justify-center overflow-hidden">
              <img src={sellerImage1} alt="Seller 1" className="w-full h-full object-cover" />
            </div>
            <div className="w-48 h-48 md:w-52 md:h-52 lg:w-72 lg:h-72 rounded-full shadow-xl bg-white flex items-center justify-center overflow-hidden fold-effect">
              <img src={sellerImage2} alt="Seller 2" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex flex-row items-center justify-center lg:justify-end w-full gap-6 -mt-9 mb-8">
            <div className="w-48 h-48 md:w-52 md:h-52 lg:w-72 lg:h-72 arrow-border shadow-xl bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={sellerImage3} alt="Seller 3" className="w-full h-full object-cover" />
            </div>
            <Link to="/pro-seller-form" className="register-anim group bg-gradient-to-r from-blue-900 to-purple-900 text-white px-8 py-4 rounded-full font-semibold text-base flex items-center hover:from-blue-800 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              <span className="flex items-center">
                Register Now
                <ArrowRight className="ml-2 w-5 h-5 arrow-anim group-hover:text-orange-300 transition-transform duration-200 sway" />
              </span>
        </Link>
          </div>
        </div>
      </div>
    </div>
  );
}