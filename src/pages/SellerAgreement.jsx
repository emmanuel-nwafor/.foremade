import React from 'react';
import '/src/theme.css';
import { Link } from 'react-router-dom';

const SellerAgreement = () => {
  return (
    <div className="min-h-screen bg-background-light py-8">
      <div className="max-w-3xl mx-auto seller-card">
        <div className="seller-header">FOREMADE Seller Agreement</div>
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 mb-4 flex items-center justify-center bg-blue-100 rounded-full">
            <i className="bx bx-file text-5xl text-blue-700"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 mb-2">FOREMADE Seller Agreement</h1>
          <p className="text-gray-600 max-w-xl">Read the terms and responsibilities for selling on FOREMADE Marketplace.</p>
        </div>
        {/* Agreement Card */}
        <div className="seller-content">
          <p className="mb-2"><strong>Effective Date:</strong> July 5, 2024</p>
          <p className="mb-2"><strong>Version:</strong> 1.0</p>
          <p className="mb-6"><strong>Platform:</strong> FOREMADE Marketplace</p>
          <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">1. Registration and Eligibility</h2>
          <ul className="list-disc ml-6 mb-4 text-blue-900">
            <li>Must be at least 18 years old.</li>
            <li>Provide accurate and verifiable personal/business information.</li>
            <li>Operate in compliance with applicable laws.</li>
          </ul>
          <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">2. Account Types</h2>
          <p className="mb-2"><Link to="/sellers-guide" className="seller-link">Standard Sellers</Link>: Up to 300 listings/month for free.<br />
            <Link to="/pro-seller-guide" className="seller-link">Pro Sellers</Link>: Up to 400 listings/month for free with added benefits.</p>
          <p className="mb-4"><strong>Additional Posting Fees:</strong> 5% charge on each item listed beyond the monthly limit.</p>
          <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">3. Fees and Payment Terms</h2>
          <ul className="list-disc ml-6 mb-4">
            <li>No listing fees within the monthly limit.</li>
            <li>All buyer protection, tax, and handling fees are included in the displayed price.</li>
            <li>Commission fees may apply depending on product category.</li>
          </ul>
          <p className="mb-4"><strong>Disbursement Options:</strong><br />Sellers can receive payments via direct bank transfer or withdraw from their secure FOREMADE wallet.</p>
          <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">4. Product Listings</h2>
          <ul className="list-disc ml-6 mb-4">
            <li>List only genuine, legal items.</li>
          </ul>
        </div>
        <footer className="seller-footer">
          &copy; {new Date().getFullYear()} Foremade. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default SellerAgreement; 