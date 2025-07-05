import React from 'react';
import { Link } from 'react-router-dom';

const SellerAgreement = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 mb-4 flex items-center justify-center bg-blue-100 rounded-full">
            <i className="bx bx-file text-5xl text-blue-700"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 mb-2">FOREMADE Seller Agreement</h1>
          <p className="text-gray-600 max-w-xl">Read the terms and responsibilities for selling on FOREMADE Marketplace.</p>
        </div>
        {/* Agreement Card */}
        <div className="bg-white/90 rounded-xl shadow-lg p-6 md:p-10 border border-blue-100">
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
          <p className="mb-2"><Link to="/sellers-guide" className="text-blue-600 underline font-semibold">Standard Sellers</Link>: Up to 300 listings/month for free.<br />
            <Link to="/pro-seller-guide" className="text-blue-600 underline font-semibold">Pro Sellers</Link>: Up to 400 listings/month for free with added benefits.</p>
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
            <li>Provide accurate images and descriptions.</li>
            <li>No duplicates or misleading content.</li>
          </ul>
          <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">5. Order Fulfillment</h2>
          <ul className="list-disc ml-6 mb-4">
            <li>Dispatch within the set timeframe.</li>
            <li>Provide tracking if using independent shipping.</li>
            <li>Work with FOREMADE logistics when applicable.</li>
          </ul>
          <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">6. Returns & Cancellations</h2>
          <p className="mb-4">Buyers may return items within 7 days of delivery under the Right of Withdrawal (some items excluded). Sellers must respond within 2 business days.</p>
          <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">7. Dispute Resolution</h2>
          <p className="mb-4">FOREMADE may act as a neutral party in disputes and make final decisions.</p>
          <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">8. Seller Conduct and Suspension</h2>
          <p className="mb-4">Accounts may be suspended or terminated for policy violations or abusive behavior.</p>
          <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">9. Data & Communication</h2>
          <p className="mb-4">FOREMADE may use your information for operational and promotional purposes. Sellers must not solicit off-platform transactions. See our <Link to="/privacy-policy" className="text-blue-600 underline font-semibold">Privacy Policy</Link> for more details.</p>
          <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">10. Termination</h2>
          <p className="mb-4">You may close your account after fulfilling orders and withdrawing your balance. FOREMADE may terminate accounts for violations with or without notice.</p>
          <p className="font-semibold text-blue-700 mt-8">By using FOREMADE, you agree to these terms. This agreement is subject to updates with notice provided via your dashboard or email.</p>
        </div>
      </div>
    </div>
  );
};

export default SellerAgreement; 