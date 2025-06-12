import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const EmpowermentHub = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Foremade Empowerment Hub
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto leading-relaxed">
              Empowering the Next Generation of Creators & Entrepreneurs
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Our Mission</h2>
          </div>
          <div className="prose prose-xl mx-auto text-gray-700 leading-relaxed">
            <p className="mb-8">
              At Foremade, we believe that the future belongs to the bold. We are committed to supporting young individuals with creative minds and entrepreneurial passion through comprehensive funding, expert mentorship, and a professional platform to showcase their talents.
            </p>
            <p>
              Our mission extends beyond providing tools—we create pathways for visionaries to bring their ideas to life and establish sustainable businesses that thrive both locally and globally. Each creator we sponsor represents the embodiment of passion, cultural heritage, and innovation.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Creator */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80"
                  alt="Handcrafted jewelry collection"
                  className="h-64 md:h-full w-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-8 md:p-12">
                <div className="mb-6">
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
                    Featured Creator
                  </span>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">Rhoda</h3>
                  <p className="text-xl text-gray-600 mb-2">Founder, Rhodabella Crafted</p>
                  <p className="text-lg text-indigo-600 font-medium">Handmade • Heritage-Inspired • Uniquely Crafted</p>
                </div>
                
                <div className="mb-8">
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    Rhoda is a distinguished jewelry designer who masterfully blends traditional African artistry with contemporary aesthetics. Her brand, <strong>Rhodabella Crafted</strong>, creates handcrafted pieces that serve as both elegant accessories and powerful expressions of cultural identity.
                  </p>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    From intricately beaded chokers to custom waist beads, each piece in Rhoda's collections tells a story of heritage, pride, and individual expression.
                  </p>
                  <blockquote className="border-l-4 border-indigo-500 pl-6 italic text-gray-600 mb-8">
                    "My jewelry transcends mere aesthetics. It honors our heritage while expressing our authentic selves."
                    <footer className="text-sm font-semibold text-gray-900 mt-2">— Rhoda, Rhodabella Crafted</footer>
                  </blockquote>
                </div>
                
                <a
                  href="https://foremade.com/store/RhodabellaCrafted"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Store
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Program Benefits</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive support designed to transform creative passion into sustainable business success
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Financial Sponsorship</h3>
              <p className="text-gray-600">Funding for product development and business growth</p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Mentorship</h3>
              <p className="text-gray-600">Professional guidance in branding and digital commerce</p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">E-commerce Platform</h3>
              <p className="text-gray-600">Professional online storefront at no cost</p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Global Promotion</h3>
              <p className="text-gray-600">Marketing and visibility across Africa and beyond</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 mb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join Our Creator Program
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Are you a young creator or entrepreneur ready to transform your vision into reality? Apply to become part of our exclusive empowerment program.
          </p>

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-center justify-center mb-8">
            <label className="flex items-center text-white">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-indigo-300 rounded border-white"
                onChange={(e) => setTermsAccepted(e.target.checked)}
                checked={termsAccepted}
              />
              <span className="ml-2 text-sm">
                I have read and agree to the{' '}
                <Link
                  to="/youth-empowerment-terms"
                  className="underline hover:text-indigo-200"
                >
                  Terms and Conditions
                </Link>
              </span>
            </label>
          </div>

          <Link 
            to={termsAccepted ? "/youth-empowerment-form" : "#"}
            className={`inline-flex items-center px-8 py-4 font-semibold rounded-lg transition-colors duration-200 ${
              termsAccepted 
                ? "bg-white text-indigo-600 hover:bg-gray-100" 
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
            onClick={(e) => {
              if (!termsAccepted) {
                e.preventDefault();
                alert("Please accept the terms and conditions to continue.");
              }
            }}
          >
            Apply Now
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default EmpowermentHub;